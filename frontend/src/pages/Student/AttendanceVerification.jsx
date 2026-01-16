import React, { useState, useContext } from 'react';
import { StudentContext } from '@/context/StudentContext';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { BiometricVerification } from '@/components/student/BiometricVerification';
import { LocationVerification } from '@/components/student/LocationVerification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MapPin, Camera, Fingerprint, CreditCard, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AttendanceVerification() {
  const { student } = useContext(StudentContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepResults, setStepResults] = useState({
    geofencing: null,
    faceRecognition: null,
    idCard: null,
    biometric: null,
  });

  const steps = [
    {
      id: 1,
      name: 'Geofencing',
      icon: MapPin,
      description: 'Location Check',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 2,
      name: 'Face Match',
      icon: Camera,
      description: 'Identity Verification',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      id: 3,
      name: 'ID Scan',
      icon: CreditCard,
      description: 'Document Check',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      id: 4,
      name: 'Biometric',
      icon: Fingerprint,
      description: 'Final Approval',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
  ];

  const handleStepSuccess = (step, result) => {
    // Add artificial delay for ux feeling
    setTimeout(() => {
      setStepResults(prev => ({ ...prev, [step]: result }));
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        submitAttendance();
      }
    }, 500);
  };

  const submitAttendance = async () => {
    // Submit all verification results to backend
    console.log('Submitting attendance with results:', stepResults);
    // API call to mark attendance
  };

  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      <StudentSidebar />
      <main className="flex-1 min-h-screen w-full transition-all duration-300 md:ml-64 ml-0 bg-background/50 pb-24 md:pb-8 flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/60 px-4 md:px-8 py-4 md:py-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Verify Attendance</h1>
              <p className="text-sm text-muted-foreground">Complete security checks to mark presence</p>
            </div>
          </div>
        </motion.header>

        <div className="flex-1 p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-4xl grid md:grid-cols-3 gap-8">

            {/* Left: Progress Steps */}
            <Card className="md:col-span-1 h-fit sticky top-28 border-0 shadow-lg bg-gradient-to-b from-card to-secondary/10">
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
                <CardDescription>Step {currentStep} of {steps.length}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                {/* Vertical line connector */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border -z-10 ml-[3px]" />

                {steps.map((step) => {
                  const isCompleted = currentStep > step.id;
                  const isCurrent = currentStep === step.id;

                  return (
                    <motion.div
                      key={step.id}
                      initial={false}
                      animate={{ opacity: isCurrent || isCompleted ? 1 : 0.5 }}
                      className="flex items-center gap-4 relative bg-card/80 backdrop-blur-sm p-2 rounded-lg"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                        isCompleted ? "bg-green-500 border-green-500 text-white" :
                          isCurrent ? `bg-white dark:bg-zinc-900 border-primary text-primary shadow-[0_0_10px_rgba(0,0,0,0.1)]` :
                            "bg-muted border-muted-foreground/30 text-muted-foreground"
                      )}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className={cn("text-sm font-semibold leading-none", isCurrent && "text-primary")}>{step.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      </div>
                      {isCurrent && (
                        <motion.div
                          layoutId="active-step-arrow"
                          className="absolute right-0 text-primary"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Right: Active Step Content */}
            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
                    <div className={cn("h-2 w-full", steps[currentStep - 1].bgColor.replace('/10', '/50'))} />
                    <CardHeader>
                      {(() => {
                        const StepIcon = steps[currentStep - 1].icon;
                        return (
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", steps[currentStep - 1].bgColor, steps[currentStep - 1].color)}>
                            <StepIcon className="w-6 h-6" />
                          </div>
                        );
                      })()}
                      <CardTitle className="text-xl">Step {currentStep}: {steps[currentStep - 1].name}</CardTitle>
                      <CardDescription>{steps[currentStep - 1].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/5 min-h-[300px]">

                      {/* Step 1: Geofencing */}
                      {currentStep === 1 && (
                        <LocationVerification
                          classId={student?.class_id}
                          onSuccess={(result) => handleStepSuccess('geofencing', result)}
                          onError={(error) => console.error('Location verification failed:', error)}
                        />
                      )}

                      {/* Step 2: Face Recognition */}
                      {currentStep === 2 && (
                        <div className="text-center space-y-4">
                          <div className="relative mx-auto w-48 h-48 bg-black rounded-2xl overflow-hidden border-4 border-dashed border-zinc-700 flex items-center justify-center">
                            <Camera className="w-12 h-12 text-zinc-500 opacity-50" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                            <span className="absolute bottom-4 text-xs font-mono text-zinc-400">Waiting for camera...</span>
                          </div>
                          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                            Position your face within the frame. Ensure good lighting.
                          </p>
                          <button
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
                            onClick={() => handleStepSuccess('faceRecognition', { verified: true })}
                          >
                            Simulate Face Match
                          </button>
                        </div>
                      )}

                      {/* Step 3: ID Card Scan */}
                      {currentStep === 3 && (
                        <div className="text-center space-y-4">
                          <div className="relative mx-auto w-64 h-40 bg-zinc-100 dark:bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
                            <CreditCard className="w-10 h-10 text-zinc-400" />
                          </div>
                          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                            Place your ID card on a flat surface and align it with the guide.
                          </p>
                          <button
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
                            onClick={() => handleStepSuccess('idCard', { verified: true })}
                          >
                            Simulate ID Scan
                          </button>
                        </div>
                      )}

                      {/* Step 4: Biometric */}
                      {currentStep === 4 && (
                        <BiometricVerification
                          studentId={student?._id}
                          sessionId="session_123"
                          onSuccess={(result) => handleStepSuccess('biometric', result)}
                          onError={(error) => console.error('Biometric failed:', error)}
                        />
                      )}

                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main >
    </div >
  );
}