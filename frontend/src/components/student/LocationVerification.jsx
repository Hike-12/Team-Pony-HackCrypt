import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MapPin, CheckCircle, Loader2, Navigation } from 'lucide-react';
import { getCurrentPosition, verifyLocation, getClassLocation } from '@/services/geofencingService';

export function LocationVerification({ classId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [classLocation, setClassLocation] = useState(null);

  useEffect(() => {
    if (classId) {
      fetchClassLocation();
    }
  }, [classId]);

  const fetchClassLocation = async () => {
    try {
      const data = await getClassLocation(classId);
      if (data.success && data.location_configured) {
        setClassLocation(data.location);
      }
    } catch (error) {
      console.error('Failed to fetch class location:', error);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      toast.info('Getting your location...');
      
      const position = await getCurrentPosition();
      console.log('GPS position:', position);

      // Verify with backend
      const result = await verifyLocation(classId, position);

      if (result.success && result.verified) {
        setVerified(true);
        setLocationData(result.location_data);
        toast.success('Location verified!');

        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        toast.error(result.message || 'Location verification failed');
        setLocationData(result.location_data);
        
        if (onError) {
          onError(new Error(result.message));
        }
      }
    } catch (error) {
      console.error('Location verification failed:', error);
      toast.error(error.message || 'Failed to verify location');
      
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
            <p className="font-medium text-green-600">Location Verified</p>
            {locationData && (
              <p className="text-xs text-muted-foreground">
                Distance: {locationData.distance}m from class
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Step 1: Location Verification
        </CardTitle>
        <CardDescription>
          Verify you're at the class location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Navigation className="h-10 w-10 text-primary" />
          </div>

          {classLocation && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg text-left">
              <p className="font-medium mb-1">Class Location:</p>
              <p>{classLocation.room_label || 'Class Room'}</p>
              <p className="text-xs mt-1">
                Allowed radius: {classLocation.allowed_radius}m
              </p>
            </div>
          )}

          {locationData && !verified && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-left">
              <p className="text-sm font-medium text-destructive mb-1">
                Too far from class
              </p>
              <p className="text-xs text-muted-foreground">
                Distance: {locationData.distance}m (Max: {locationData.allowed_radius}m)
              </p>
            </div>
          )}

          <Button
            onClick={handleVerify}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <MapPin className="mr-2 h-5 w-5" />
            Verify Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
