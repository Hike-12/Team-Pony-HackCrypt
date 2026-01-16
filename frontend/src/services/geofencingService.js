const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`;

/**
 * Get user's current position with high accuracy
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('GPS Data:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });

        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Location access denied';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Try going near a window or outdoors.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Verify location for attendance (Step 1)
 */
export const verifyLocation = async (classId, position) => {
  try {
    const response = await fetch(`${API_BASE_URL}/student/geofencing/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        class_id: classId,
        latitude: position.latitude,
        longitude: position.longitude
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Geofencing verification error:', error);
    throw error;
  }
};

/**
 * Get class location info
 */
export const getClassLocation = async (classId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/student/geofencing/class/${classId}`, {
      credentials: 'include',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get class location error:', error);
    throw error;
  }
};

/**
 * Admin: Update class location
 */
export const updateClassLocation = async (classId, locationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/geofencing/${classId}/location`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(locationData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update class location error:', error);
    throw error;
  }
};

/**
 * Calculate distance between two points (for display)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
