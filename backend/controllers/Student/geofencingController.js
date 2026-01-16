const Class = require('../../models/Class');

/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
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
}

/**
 * Verify location for attendance (Step 1 of pipeline)
 */
exports.verifyLocation = async (req, res) => {
  try {
    const { class_id, latitude, longitude } = req.body;

    if (!class_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'class_id, latitude, and longitude are required'
      });
    }

    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if location is configured
    if (!classData.location?.latitude || !classData.location?.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Class location not configured. Contact admin.',
        location_configured: false
      });
    }

    // Calculate distance
    const distance = calculateDistance(
      classData.location.latitude,
      classData.location.longitude,
      latitude,
      longitude
    );

    const allowedRadius = classData.location.allowed_radius || 50;
    const verified = distance <= allowedRadius;

    // Log for debugging
    console.log('Location verification:', {
      distance: distance,
      allowed_radius: allowedRadius,
      verified: verified
    });

    res.json({
      success: true,
      verified,
      location_data: {
        distance: Math.round(distance * 100) / 100,
        allowed_radius: allowedRadius,
        room_label: classData.location.room_label
      },
      message: verified
        ? 'Location verified'
        : `Too far: ${Math.round(distance)}m away (max: ${allowedRadius}m)`
    });
  } catch (error) {
    console.error('Geofencing error:', error);
    res.status(500).json({
      success: false,
      message: 'Location verification failed',
      error: error.message
    });
  }
};

/**
 * Get class location info
 */
exports.getClassLocation = async (req, res) => {
  try {
    const { class_id } = req.params;

    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (!classData.location?.latitude || !classData.location?.longitude) {
      return res.json({
        success: true,
        location_configured: false,
        message: 'Location not configured'
      });
    }

    res.json({
      success: true,
      location_configured: true,
      location: {
        latitude: classData.location.latitude,
        longitude: classData.location.longitude,
        allowed_radius: classData.location.allowed_radius || 50,
        room_label: classData.location.room_label
      },
      class_info: {
        name: classData.name,
        division: classData.division,
        batch_year: classData.batch_year
      }
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location',
      error: error.message
    });
  }
};

/**
 * Admin: Update class location
 */
exports.updateClassLocation = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { latitude, longitude, allowed_radius, room_label } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'latitude and longitude are required'
      });
    }

    const classData = await Class.findByIdAndUpdate(
      class_id,
      {
        location: {
          latitude,
          longitude,
          allowed_radius: allowed_radius || 50,
          room_label
        }
      },
      { new: true }
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      class: classData
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};
