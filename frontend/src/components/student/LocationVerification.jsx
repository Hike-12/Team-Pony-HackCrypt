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
      <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-1">Location Verified</h3>
        {locationData && (
          <p className="text-sm text-green-600/80 dark:text-green-400/80">
            Distance: {locationData.distance}m from class
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center ring-1 ring-blue-100 dark:ring-blue-900/20">
          <Navigation className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>

        <h3 className="text-lg font-semibold">Confirm Location</h3>
        <p className="text-sm text-muted-foreground">
          Verify that you are physically present in the classroom.
        </p>
      </div>

      <div className="space-y-4">
        {classLocation && (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted-foreground">Target Location:</span>
              <span className="font-medium text-foreground">{classLocation.room_label || 'Class Room'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Allowed Radius:</span>
              <span className="font-medium text-foreground">{classLocation.allowed_radius}m</span>
            </div>
          </div>
        )}

        {locationData && !verified && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 p-4 rounded-xl flex gap-3 text-red-600 dark:text-red-400 text-sm">
            <MapPin className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Verification Failed</p>
              <p className="opacity-90 mt-0.5">
                Distance: {locationData.distance}m (Max: {locationData.allowed_radius}m)
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={handleVerify}
          disabled={loading}
          size="lg"
          className="w-full h-12 text-base shadow-lg shadow-blue-500/20"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {!loading && <MapPin className="mr-2 h-5 w-5" />}
          Verify My Location
        </Button>
      </div>
    </div>
  );
}
