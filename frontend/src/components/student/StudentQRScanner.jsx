import React, { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CheckCircle, XCircle, Loader2, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StudentQRScanner = () => {
    const [scanning, setScanning] = useState(false);
    const [hasCamera, setHasCamera] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);
    
    const videoRef = useRef(null);
    const scannerRef = useRef(null);
    const { toast } = useToast();

    useEffect(() => {
        // Check if device has camera
        checkCamera();

        return () => {
            // Cleanup scanner on unmount
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

            // Initialize QR Scanner
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
        if (processing) return; // Prevent multiple scans

        try {
            setProcessing(true);

            // Parse QR data
            let qrData;
            try {
                qrData = JSON.parse(data);
            } catch (e) {
                throw new Error('Invalid QR code format');
            }

            if (!qrData.token || !qrData.sessionId) {
                throw new Error('Invalid attendance QR code');
            }

            // Submit attendance
            const token = localStorage.getItem('studentToken');
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/qr/scan`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: qrData.token,
                    sessionId: qrData.sessionId
                })
            });

            const result = await response.json();

            if (result.success) {
                setLastScanResult({
                    success: true,
                    message: result.message,
                    data: result.data
                });

                toast({
                    title: "Attendance Marked! ✓",
                    description: `You are present for ${result.data.subject}`,
                });

                // Stop scanning after successful scan
                stopScanning();
            } else {
                setLastScanResult({
                    success: false,
                    message: result.message
                });

                toast({
                    title: "Attendance Failed",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Scan error:', error);
            
            setLastScanResult({
                success: false,
                message: error.message || 'Failed to mark attendance'
            });

            toast({
                title: "Error",
                description: error.message || 'Failed to mark attendance',
                variant: "destructive"
            });
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
                        Scan QR Code for Attendance
                    </CardTitle>
                    <CardDescription>
                        Point your camera at the teacher's QR code to mark your attendance
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
                            {/* Video Preview */}
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

                            {/* Controls */}
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

                            {/* Last Scan Result */}
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
                                                <p className={`font-medium ${
                                                    lastScanResult.success ? 'text-green-900' : 'text-red-900'
                                                }`}>
                                                    {lastScanResult.message}
                                                </p>
                                                {lastScanResult.success && lastScanResult.data && (
                                                    <div className="mt-2 text-sm text-green-800">
                                                        <p><strong>Subject:</strong> {lastScanResult.data.subject}</p>
                                                        <p><strong>Student:</strong> {lastScanResult.data.student.name}</p>
                                                        <p><strong>Class:</strong> {lastScanResult.data.student.class}</p>
                                                        <p><strong>Time:</strong> {new Date(lastScanResult.data.timestamp).toLocaleString()}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">How to use</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Click "Start Scanner" to activate your camera</li>
                        <li>Point your camera at the QR code displayed by your teacher</li>
                        <li>Wait for the automatic scan (takes 1-2 seconds)</li>
                        <li>You'll see a confirmation once attendance is marked</li>
                    </ol>
                    <p className="mt-4 text-xs">
                        <strong>Note:</strong> The QR code changes every 15 seconds for security. Make sure to scan when you're in class.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentQRScanner;
