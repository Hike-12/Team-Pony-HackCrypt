import React, { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CheckCircle, XCircle, Loader2, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StudentQRScanner = ({ sessionId, onSuccess, onError }) => {
    const [scanning, setScanning] = useState(false);
    const [hasCamera, setHasCamera] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);
    
    const videoRef = useRef(null);
    const scannerRef = useRef(null);
    const { toast } = useToast();

    useEffect(() => {
        checkCamera();
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop();
                scannerRef.current.destroy();
            }
        };
    }, []);

    const checkCamera = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setHasCamera(videoDevices.length > 0);
        } catch (error) {
            console.error('Error checking camera:', error);
            setHasCamera(false);
        }
    };

    const startScanning = async () => {
        try {
            if (!videoRef.current) return;
            setScanning(true);

            scannerRef.current = new QrScanner(
                videoRef.current,
                (result) => handleScan(result.data),
                {
                    returnDetailedScanResult: true,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    maxScansPerSecond: 5,
                }
            );

            await scannerRef.current.start();
        } catch (error) {
            console.error('Error starting scanner:', error);
            toast({
                title: "Camera Error",
                description: "Unable to access camera. Please check permissions.",
                variant: "destructive"
            });
            setScanning(false);
        }
    };

    const stopScanning = () => {
        if (scannerRef.current) {
            scannerRef.current.stop();
        }
        setScanning(false);
    };

    const handleScan = async (data) => {
        if (processing) return;

        try {
            setProcessing(true);
            console.log('Raw QR data:', data);

            let qrData;
            try {
                qrData = JSON.parse(data);
            } catch (e) {
                throw new Error('Invalid QR code format');
            }

            console.log('Parsed QR data:', qrData);

            // Check if this is an attendance QR code (has token and sessionId)
            if (qrData.token && qrData.sessionId) {
                // This is an attendance QR code from teacher
                console.log('Attendance QR detected');
                console.log('Expected sessionId:', sessionId);
                console.log('QR sessionId:', qrData.sessionId);
                
                // Verify this QR is for the current session
                if (sessionId && qrData.sessionId !== sessionId) {
                    throw new Error('This QR code is for a different attendance session');
                }
                
                // Call onSuccess with qrToken for attendance marking
                if (onSuccess) {
                    onSuccess({
                        verified: true,
                        qrToken: qrData.token
                    });
                }

                setLastScanResult({
                    success: true,
                    message: 'Attendance QR scanned successfully'
                });

                toast({
                    title: "QR Code Verified",
                    description: "Attendance QR scanned successfully"
                });

                stopScanning();
            } 
            // Check if this is a student ID QR code (has user_id and type)
            else if (qrData.user_id && qrData.type === 'student') {
                // This is a student ID QR code - auto mark attendance
                console.log('Student ID QR detected, auto-marking attendance');
                
                const token = localStorage.getItem('studentToken');
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/student/attendance/quick-mark`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ user_id: qrData.user_id })
                    }
                );

                const result = await response.json();
                
                if (result.success) {
                    if (onSuccess) {
                        onSuccess({
                            verified: true,
                            qrToken: 'STUDENT_ID_QR'
                        });
                    }

                    setLastScanResult({
                        success: true,
                        message: 'Attendance marked using your student ID!'
                    });

                    toast({
                        title: "Success",
                        description: "Attendance marked successfully using your student ID!"
                    });

                    stopScanning();
                } else {
                    throw new Error(result.message || 'Failed to mark attendance');
                }
            } 
            else {
                throw new Error('Invalid QR code. Please scan the attendance QR code displayed by your teacher.');
            }

        } catch (error) {
            console.error('Scan error:', error);
            
            setLastScanResult({
                success: false,
                message: error.message || 'Failed to scan QR code'
            });

            toast({
                title: "Invalid QR Code",
                description: error.message || 'Please scan the attendance QR code displayed by your teacher.',
                variant: "destructive"
            });

            if (onError) {
                onError(error);
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="h-6 w-6" />
                        Scan Attendance QR Code
                    </CardTitle>
                    <CardDescription>
                        Point your camera at the QR code displayed by your teacher (not your student ID)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!hasCamera ? (
                        <div className="text-center py-8">
                            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No camera detected on this device</p>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <video
                                    ref={videoRef}
                                    className={`w-full rounded-lg border-4 ${
                                        scanning ? 'border-primary' : 'border-muted'
                                    } ${!scanning && 'hidden'}`}
                                    style={{ maxHeight: '400px' }}
                                />
                                
                                {scanning && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="relative w-64 h-64">
                                            <div className="absolute inset-0 border-4 border-primary rounded-lg"></div>
                                            <ScanLine className="absolute top-0 left-1/2 transform -translate-x-1/2 h-6 w-full text-primary animate-pulse" />
                                        </div>
                                    </div>
                                )}

                                {processing && scanning && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                        <div className="text-center text-white">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                            <p>Processing...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {!scanning ? (
                                    <Button 
                                        onClick={startScanning}
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Start Scanner
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={stopScanning}
                                        variant="destructive"
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        Stop Scanner
                                    </Button>
                                )}
                            </div>

                            {lastScanResult && (
                                <Card className={
                                    lastScanResult.success 
                                        ? 'bg-green-50 border-green-200' 
                                        : 'bg-red-50 border-red-200'
                                }>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-3">
                                            {lastScanResult.success ? (
                                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${
                                                    lastScanResult.success ? 'text-green-900' : 'text-red-900'
                                                }`}>
                                                    {lastScanResult.message}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Important Notes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <ul className="list-disc list-inside space-y-1">
                        <li>Scan the <strong>attendance QR code</strong> displayed by your teacher</li>
                        <li>Do NOT scan your student ID QR code</li>
                        <li>The attendance QR changes every 2 minutes for security</li>
                        <li>Make sure you're in the correct classroom</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentQRScanner;