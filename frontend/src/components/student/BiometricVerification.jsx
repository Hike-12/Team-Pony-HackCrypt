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
      <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-1">Identity Verified</h3>
        <p className="text-sm text-green-600/80 dark:text-green-400/80">
          Biometric authentication successful
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center ring-1 ring-purple-100 dark:ring-purple-900/20">
          <Fingerprint className="h-10 w-10 text-purple-600 dark:text-purple-400" />
        </div>

        <h3 className="text-lg font-semibold">Biometric Check</h3>
        <p className="text-sm text-muted-foreground">
          Authenticate using your device's fingerprint or face ID.
        </p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleVerify}
          disabled={loading}
          size="lg"
          className="w-full h-12 text-base shadow-lg shadow-purple-500/20"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {!loading && <Fingerprint className="mr-2 h-5 w-5" />}
          Authenticate Now
        </Button>

        <div className="flex items-start gap-3 text-xs text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-zinc-500" />
          <p className="text-left leading-relaxed">
            We use your device's secure hardware (Touch ID / Face ID) to confirm it's really you. No biometric data is stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}