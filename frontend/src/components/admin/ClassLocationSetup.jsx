import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { getCurrentPosition, updateClassLocation } from '@/services/geofencingService';

export function ClassLocationSetup({ classData, onLocationUpdated }) {
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    latitude: classData?.location?.latitude || '',
    longitude: classData?.location?.longitude || '',
    allowed_radius: classData?.location?.allowed_radius || 50,
    room_label: classData?.location?.room_label || ''
  });

  useEffect(() => {
    if (classData?.location) {
      setFormData({
        latitude: classData.location.latitude || '',
        longitude: classData.location.longitude || '',
        allowed_radius: classData.location.allowed_radius || 50,
        room_label: classData.location.room_label || ''
      });
    }
  }, [classData]);

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      toast.info('Getting your location...');
      const position = await getCurrentPosition();
      setFormData(prev => ({
        ...prev,
        latitude: position.latitude.toFixed(8),
        longitude: position.longitude.toFixed(8),
      }));
      toast.success('Location captured!');
    } catch (error) {
      toast.error(error.message || 'Failed to get location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const locationData = {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        allowed_radius: parseInt(formData.allowed_radius),
        room_label: formData.room_label
      };

      const result = await updateClassLocation(classData._id, locationData);

      if (result.success) {
        toast.success('Class location updated successfully');
        if (onLocationUpdated) {
          onLocationUpdated(result.class);
        }
      } else {
        toast.error(result.message || 'Failed to update location');
      }
    } catch (error) {
      console.error('Update location error:', error);
      toast.error('Failed to update class location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Class Location Setup
        </CardTitle>
        <CardDescription>
          Set geofencing coordinates for attendance verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={gettingLocation}
              variant="outline"
              className="w-full"
            >
              {gettingLocation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Navigation className="mr-2 h-4 w-4" />
              Use Current Location
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g., 19.0760"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g., 72.8777"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allowed_radius">Allowed Radius (m) *</Label>
              <Input
                id="allowed_radius"
                type="number"
                placeholder="50"
                value={formData.allowed_radius}
                onChange={(e) => setFormData({ ...formData, allowed_radius: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 50-150m for indoor GPS drift
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room_label">Room Label</Label>
              <Input
                id="room_label"
                placeholder="e.g., Room 301"
                value={formData.room_label}
                onChange={(e) => setFormData({ ...formData, room_label: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Location
          </Button>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-medium mb-1">Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>GPS works best outdoors or near windows</li>
              <li>Indoor GPS can drift 50-100m - adjust radius accordingly</li>
              <li>Test after setting to verify accuracy</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
