const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  batch_year: { type: Number, required: true },
  division: { type: String, required: true },
  // Geofencing location data
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    allowed_radius: { type: Number, default: 50 }, // meters
    room_label: { type: String }
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', classSchema);