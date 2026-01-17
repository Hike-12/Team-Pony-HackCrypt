import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Fingerprint, CheckCircle, AlertCircle } from 'lucide-react';
import { enrollBiometric, getEnrolledCredentials } from '@/services/webauthnService';
import { toast } from 'sonner';

export function BiometricEnrollmentModal({ studentId, studentName, onClose }) {
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [credentials, setCredentials] = useState([]);

  const fetchCredentials = async () => {
    try {
      const result = await getEnrolledCredentials(studentId);
      setCredentials(result.credentials || []);
      setEnrolled((result.credentials || []).length > 0);
    } catch (error) {
      toast.error('Failed to fetch credentials');
    }
  };

  const handleEnroll = async () => {
    setLoading(true);
    try {
      await enrollBiometric(studentId);
      toast.success('Biometric enrolled successfully!');
      setEnrolled(true);
      fetchCredentials();
    } catch (error) {
      toast.error(error.message || 'Failed to enroll biometric');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
    // eslint-disable-next-line
  }, [studentId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-6 w-6" />
            Biometric Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="font-semibold mb-2">Student:</div>
            <div className="mb-4">{studentName}</div>
            {enrolled ? (
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle className="h-5 w-5" />
                Biometric already enrolled
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <AlertCircle className="h-5 w-5" />
                No biometric enrolled yet
              </div>
            )}
            <Button
              onClick={handleEnroll}
              disabled={loading || enrolled}
              className="w-full"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enroll Biometric
            </Button>
          </div>
          {credentials.length > 0 && (
            <div className="mt-4">
              <div className="font-semibold mb-2">Enrolled Devices:</div>
              <ul className="space-y-2">
                {credentials.map((cred, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    {cred.device_type || 'Authenticator'} - Enrolled: {new Date(cred.enrolled_at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full"
            style={{
              background: 'var(--secondary)',
              color: 'var(--secondary-foreground)'
            }}
          >
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}