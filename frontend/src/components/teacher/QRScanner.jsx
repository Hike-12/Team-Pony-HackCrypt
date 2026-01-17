import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Camera, X, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

const QRScanner = ({ onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [error, setError] = useState(null);
  const [lastScannedQR, setLastScannedQR] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const cooldownRef = useRef(false);

  // Fetch current lecture info
  useEffect(() => {
    fetchCurrentLecture();
  }, []);

  const fetchCurrentLecture = async () => {
    try {
      const token = Cookies.get('teacherToken');
      const response = await fetch('http://localhost:8000/api/teacher/attendance/current-lecture', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      if (result.success && result.data) {
        setCurrentLecture(result.data);
      } else {
        setError('No active lecture at this time');
      }
    } catch (err) {
      console.error('Error fetching current lecture:', err);
      setError('Failed to fetch lecture information');
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        
        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(scanQRCode, 500);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing || cooldownRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use jsQR library to decode QR code
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code && code.data !== lastScannedQR) {
          await handleQRCodeScanned(code.data);
        }
      }
    }
  };

  const handleQRCodeScanned = async (qrData) => {
    if (isProcessing || cooldownRef.current) return;
    
    setIsProcessing(true);
    cooldownRef.current = true;
    setLastScannedQR(qrData);
    
    try {
      console.log('Raw QR Data received:', qrData);

      // Extract user_id from QR data
      let userId;
      
      try {
        const parsed = JSON.parse(qrData);
        console.log('Parsed JSON:', parsed);
        userId = parsed.user_id || parsed.userId || parsed.id || parsed._id;
        console.log('Extracted user_id:', userId);
      } catch (e) {
        // If not JSON, assume the QR data is the user_id itself
        console.log('Not JSON, treating as plain ID');
        userId = qrData ? qrData.trim() : null;
        console.log('Extracted plain ID:', userId);
      }

      if (!userId || userId.length === 0) {
        console.error('userId is empty or null');
        toast.error('Invalid QR code format - empty ID');
        setIsProcessing(false);
        // Reset cooldown after 2 seconds for failed scans
        setTimeout(() => {
          cooldownRef.current = false;
          setLastScannedQR(null);
        }, 2000);
        return;
      }

      const token = Cookies.get('teacherToken');
      
      if (!token) {
        toast.error('Authentication token not found');
        setIsProcessing(false);
        setTimeout(() => {
          cooldownRef.current = false;
          setLastScannedQR(null);
        }, 2000);
        return;
      }

      console.log('Calling scan student QR with user_id:', userId);

      // Call teacher scan student QR endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/scan-student-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId })
      });

      const result = await response.json();
      console.log('Scan student QR response:', result);

      if (result.success) {
        if (result.alreadyMarked) {
          toast.info(result.message, {
            description: 'Student attendance was already recorded'
          });
        } else {
          toast.success(result.message, {
            description: result.data ? `${result.data.roll_no} - ${result.data.student}` : 'Attendance marked'
          });
        }
        
        // Longer pause before allowing next scan (5 seconds)
        setTimeout(() => {
          setIsProcessing(false);
          cooldownRef.current = false;
          setLastScannedQR(null);
        }, 5000);
      } else {
        toast.error(result.message || 'Failed to verify student');
        setIsProcessing(false);
        // Reset cooldown after 2 seconds for failed scans
        setTimeout(() => {
          cooldownRef.current = false;
          setLastScannedQR(null);
        }, 2000);
      }

    } catch (err) {
      console.error('Error verifying attendance:', err);
      toast.error('Failed to verify attendance: ' + err.message);
      setIsProcessing(false);
      // Reset cooldown after 2 seconds for errors
      setTimeout(() => {
        cooldownRef.current = false;
        setLastScannedQR(null);
      }, 2000);
    }
  };

  useEffect(() => {
    // Load jsQR library
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    document.head.appendChild(script);

    return () => {
      stopCamera();
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">QR Code Scanner</h2>
            {currentLecture && (
              <p className="text-sm text-muted-foreground mt-1">
                {currentLecture.subject} - {currentLecture.class} ({currentLecture.session_type})
              </p>
            )}
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {!currentLecture && !error && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {currentLecture && (
            <>
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-96 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-white" />
                  </div>
                )}

                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Camera not started</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-3">
                {!isScanning ? (
                  <button
                    onClick={startCamera}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors font-medium"
                  >
                    Stop Camera
                  </button>
                )}
                
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-6 py-2 border rounded-md hover:bg-accent transition-colors font-medium"
                >
                  Close
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Instructions:</strong> Click "Start Camera" and ask students to show their QR code. 
                  The system will automatically verify if they belong to this class and lecture.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
