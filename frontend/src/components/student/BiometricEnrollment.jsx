import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Fingerprint, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { 
  enrollBiometric, 
  getEnrolledCredentials, 
  removeCredential,
  isPlatformAuthenticatorAvailable 
} from '@/services/webauthnService';

export function BiometricEnrollment({ studentId }) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [hasSupport, setHasSupport] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSupport();
    fetchCredentials();
  }, [studentId]);

  const checkSupport = async () => {
    setChecking(true);
    const supported = await isPlatformAuthenticatorAvailable();
    setHasSupport(supported);
    setChecking(false);
  };

  const fetchCredentials = async () => {
    if (!studentId) {
      console.log('No studentId, skipping fetch credentials');
      return;
    }
    
    try {
      const result = await getEnrolledCredentials(studentId);
      setCredentials(result.credentials || []);
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    }
  };

  const handleEnroll = async () => {
    if (!studentId) {
      toast.error('Student ID not found. Please log in again.');
      return;
    }
    
    setLoading(true);
    try {
      await enrollBiometric(studentId);
      toast.success('Biometric enrolled successfully!');
      await fetchCredentials();
    } catch (error) {
      console.error('Enrollment failed:', error);
      toast.error(error.message || 'Failed to enroll biometric');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (credentialId) => {
    try {
      await removeCredential(credentialId, studentId);
      toast.success('Credential removed successfully');
      await fetchCredentials();
    } catch (error) {
      console.error('Remove failed:', error);
      toast.error('Failed to remove credential');
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (!studentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Student ID Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load student information. Please log out and log in again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hasSupport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Biometric Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your device doesn't support biometric authentication. Please use a device with Touch ID, Face ID, or Windows Hello.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Biometric Authentication
        </CardTitle>
        <CardDescription>
          Enroll your biometric for secure attendance verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {credentials.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              No biometric enrolled yet. Click below to set up.
            </p>
            <Button onClick={handleEnroll} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Fingerprint className="mr-2 h-4 w-4" />
              Enroll Biometric
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Biometric Enrolled</span>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            
            {credentials.map((cred) => (
              <div key={cred._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {cred.device_type || 'Platform Authenticator'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enrolled: {new Date(cred.enrolled_at).toLocaleDateString()}
                  </p>
                  {cred.last_used && (
                    <p className="text-xs text-muted-foreground">
                      Last used: {new Date(cred.last_used).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleRemove(cred._id)}
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button onClick={handleEnroll} disabled={loading} variant="outline" className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Another Device
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}