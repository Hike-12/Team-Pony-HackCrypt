import React, { useState, useContext } from 'react';
import { StudentContext } from '@/context/StudentContext';
import { BiometricVerification } from '@/components/student/BiometricVerification';
import { LocationVerification } from '@/components/student/LocationVerification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MapPin, Camera, Fingerprint, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      description: 'Verify your location'
    },
    { 
      id: 2, 
      name: 'Face Recognition', 
      icon: Camera,
      description: 'Verify your face'
    },
    { 
      id: 3, 
      name: 'ID Card Scan', 
      icon: CreditCard,
      description: 'Scan your ID card'
    },
    { 
      id: 4, 
      name: 'Biometric', 
      icon: Fingerprint,
      description: 'Verify biometric'
    },
  ];

  const handleStepSuccess = (step, result) => {
    setStepResults(prev => ({ ...prev, [step]: result }));
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps completed - submit attendance
      submitAttendance();
    }
  };

  const submitAttendance = async () => {
    // Submit all verification results to backend
    console.log('Submitting attendance with results:', stepResults);
    // API call to mark attendance
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>
            Complete all 4 verification steps to mark your attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                    currentStep > step.id ? "bg-green-500 text-white" :
                    currentStep === step.id ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-1 mx-2 transition-colors",
                    currentStep > step.id ? "bg-green-500" : "bg-muted"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Step 2: Face Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Your friend's face recognition component */}
                  <p className="text-muted-foreground">Face recognition component will go here</p>
                  <button onClick={() => handleStepSuccess('faceRecognition', { verified: true })}>
                    Simulate Success
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Step 3: ID Card Scan */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Step 3: ID Card Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* ID card scanning component */}
                  <p className="text-muted-foreground">ID card scanning component will go here</p>
                  <button onClick={() => handleStepSuccess('idCard', { verified: true })}>
                    Simulate Success
                  </button>
                </CardContent>
              </Card>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}