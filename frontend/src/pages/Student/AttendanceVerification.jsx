import React, { useState, useEffect, useContext } from 'react';
import { StudentContext } from '@/context/StudentContext';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import AttendanceScanner from '@/components/student/AttendanceScanner';
import { BiometricVerification } from '@/components/student/BiometricVerification';
import { LocationVerification } from '@/components/student/LocationVerification';
import StudentQRScanner from '../../components/student/StudentQRScanner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, MapPin, Camera, Fingerprint, QrCode, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AttendanceVerification() {
  const { student } = useContext(StudentContext);
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepResults, setStepResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [faceEmbedding, setFaceEmbedding] = useState(null);

  // Fetch active session with polling
  useEffect(() => {
    async function fetchSession(isPolling = false) {
      // Don't show loading on polling requests
      if (!isPolling) {
        setLoading(true);
      }
      try {
        const token = localStorage.getItem('studentToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/attendance/active-session`, {
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);
        } else {
          setSession(null);
          if (!data.success && !isPolling) toast.error(data.message || 'No active attendance session');
        }
      } catch (err) {
        if (!isPolling) {
          toast.error('Failed to fetch session');
        }
        setSession(null);
      } finally {
        if (!isPolling) {
          setLoading(false);
        }
      }
    }
    
    // Initial fetch
    fetchSession();
    
    // Set up polling interval - fetch every 1 second when there's an active session
    const pollInterval = setInterval(() => {
      fetchSession(true);
    }, 1000);
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [student]);

  // Fetch face biometric
  useEffect(() => {
    async function fetchBiometric() {
      if (!student?._id && !student?.student_id) return;
      try {
        const id = student._id || student.student_id;
        const token = localStorage.getItem('studentToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/biometric/${id}`, {
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          let embedding = data.face_embedding;
          if (embedding && typeof embedding === 'object' && !Array.isArray(embedding)) {
            embedding = Object.values(embedding);
          }
          setFaceEmbedding(embedding);
        }
      } catch (e) {
        console.error("Failed to load face embedding", e);
      }
    }
    fetchBiometric();
  }, [student]);

  // Build steps
  const steps = [];
  if (session?.enable_geofencing) steps.push({
    key: 'geofencing',
    name: 'Location Check',
    icon: MapPin,
    description: 'Geofencing Verification',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  });
  if (session?.enable_face) steps.push({
    key: 'faceRecognition',
    name: 'Face Match',
    icon: Camera,
    description: 'Identity Verification',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  });
  if (session?.enable_static_qr || session?.enable_dynamic_qr) steps.push({
    key: 'idCard',
    name: 'QR Scan',
    icon: QrCode,
    description: 'QR Code Verification',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  });
  if (session?.enable_biometric) steps.push({
    key: 'biometric',
    name: 'Biometric Auth',
    icon: Fingerprint,
    description: 'Biometric Authentication',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  });

  const handleStepSuccess = (stepKey, result) => {
    const updatedResults = { ...stepResults, [stepKey]: result };
    setStepResults(updatedResults);
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAttendance(updatedResults);
    }
  };

  const submitAttendance = async (results) => {
    if (!session) return;
    setLoading(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem('studentToken');
      const payload = {
        sessionId: session._id,
        faceData: results.faceRecognition,
        biometricData: results.biometric,
        location: results.geofencing?.location || results.geofencing,
        qrToken: results.idCard?.token || results.idCard?.qrToken,
      };
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/attendance/mark`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Attendance marked!');
        setFeedback({ success: true, details: data.details });
      } else {
        toast.error(data.message || 'Verification failed');
        setFeedback({ success: false, details: data.details });
      }
    } catch (err) {
      toast.error('Failed to submit attendance');
      setFeedback({ success: false, details: { fail_reason: err.message } });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step.key) {
      case 'geofencing':
        return (
          <LocationVerification
            classId={student?.class_id}
            onSuccess={(result) => handleStepSuccess('geofencing', result)}
            onError={(error) => toast.error(error.message || 'Location verification failed')}
          />
        );
      case 'faceRecognition':
        return (
          <AttendanceScanner
            storedDescriptor={faceEmbedding}
            onSuccess={(result) => handleStepSuccess('faceRecognition', result)}
          />
        );
      case 'idCard':
        return (
          <StudentQRScanner
            sessionId={session?._id}
            onSuccess={(result) => handleStepSuccess('idCard', result)}
            onError={(error) => toast.error(error.message || 'QR scan failed')}
          />
        );
      case 'biometric':
        return (
          <BiometricVerification
            studentId={student?._id}
            sessionId={session?._id}
            onSuccess={(result) => handleStepSuccess('biometric', result)}
            onError={(error) => toast.error(error.message || 'Biometric failed')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      <StudentSidebar />
      <main className="flex-1 w-full transition-all duration-300 md:ml-64 ml-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Attendance Verification</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex h-2 w-2 rounded-full bg-green-500" />
                Secure Environment Active
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-12 flex items-center justify-center bg-muted/20">
          <Card className="w-full max-w-5xl overflow-hidden border shadow-xl flex flex-col md:flex-row min-h-[550px] bg-card">
            {/* Left Panel: Steps */}
            <div className="md:w-1/3 bg-muted/30 border-r p-6 md:p-8 flex flex-col justify-between relative">
              <div className="space-y-6 md:space-y-8">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight mb-1">Verification Steps</h2>
                  <p className="text-sm text-muted-foreground">Complete all checks to mark your attendance.</p>
                </div>
                <div className="space-y-4 relative">
                  <div className="absolute left-6 top-4 bottom-4 w-px bg-border -z-10 ml-0.5" />
                  {steps.map((step, idx) => {
                    const isCompleted = currentStep > idx + 1;
                    const isCurrent = currentStep === idx + 1;
                    return (
                      <div key={step.key} className={cn("relative flex items-center gap-4 py-1 transition-opacity duration-300",
                        isCurrent ? "opacity-100" : isCompleted ? "opacity-60" : "opacity-40"
                      )}>
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 shrink-0 bg-background z-10",
                          isCompleted ? "border-green-500 text-green-500" :
                            isCurrent ? cn("border-primary text-primary shadow-lg", step.color) : "border-muted text-muted-foreground"
                        )}>
                          {isCompleted ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className={cn("text-sm font-bold", isCurrent ? "text-foreground" : "text-muted-foreground")}>{step.name}</p>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">{step.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground bg-background/50 p-3 rounded-lg border">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Please ensure you are in a well-lit area for verification.</span>
              </div>
            </div>

            {/* Right Panel: Current Step */}
            <div className="md:w-2/3 p-6 md:p-10 flex flex-col relative bg-background">
              <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full"
                  >
                    <div className="text-center mb-10">
                      {(() => {
                        const StepIcon = steps[currentStep - 1]?.icon;
                        return (
                          <div className={cn("w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-muted animate-pulse-slow", steps[currentStep - 1]?.bgColor)}>
                            {StepIcon && <StepIcon className={cn("w-8 h-8", steps[currentStep - 1]?.color)} />}
                          </div>
                        );
                      })()}
                      <h2 className="text-2xl font-bold tracking-tight mb-2">{steps[currentStep - 1]?.name}</h2>
                      <p className="text-muted-foreground">{steps[currentStep - 1]?.description}</p>
                    </div>
                    <div className="w-full">
                      {loading && <div className="text-center py-8">Loading...</div>}
                      {!loading && session && renderStepContent(steps[currentStep - 1])}
                      {!loading && !session && (
                        <div className="text-center py-8 text-muted-foreground">
                          No active attendance session. Please wait for your teacher to start.
                        </div>
                      )}
                      {feedback && (
                        <div className={cn(
                          "mt-8 p-4 rounded-lg text-center",
                          feedback.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        )}>
                          <h3 className="font-bold text-lg mb-2">
                            {feedback.success ? "Attendance Marked!" : "Verification Failed"}
                          </h3>
                          <div className="text-sm mb-4">
                            {feedback.details?.fail_reason || (feedback.success ? "All verification steps passed." : "Some verification steps failed.")}
                          </div>
                          <Button
                            onClick={() => window.location.href = '/student/dashboard'}
                            className="w-full"
                          >
                            Done
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="absolute bottom-6 right-6 flex gap-1">
                {steps.map((_, i) => (
                  <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i + 1 === currentStep ? "bg-primary w-3" : "bg-muted-foreground/30")} />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}