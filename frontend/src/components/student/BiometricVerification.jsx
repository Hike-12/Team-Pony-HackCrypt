import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Fingerprint, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { verifyBiometric } from '@/services/webauthnService';

export function BiometricVerification({ studentId, sessionId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const result = await verifyBiometric(studentId, sessionId);
      
      if (result.success && result.verified) {
        setVerified(true);
        toast.success('Biometric verified successfully!');
        
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error(error.message || 'Biometric verification failed');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <Card className="border-green-500">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="font-medium text-green-600">Biometric Verified</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Step 4: Biometric Verification
        </CardTitle>
        <CardDescription>
          Verify your identity using biometric authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Fingerprint className="h-10 w-10 text-primary" />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Click the button below to authenticate using your device's biometric sensor
          </p>

          <Button 
            onClick={handleVerify} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Fingerprint className="mr-2 h-5 w-5" />
            Verify Biometric
          </Button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-left">
              You'll be prompted to authenticate using your device's biometric sensor (Touch ID, Face ID, or Windows Hello).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}