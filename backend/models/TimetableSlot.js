const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema({
  slot_name: { type: String, unique: true, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  sort_order: { type: Number }
});

timetableSlotSchema.index({ start_time: 1, end_time: 1 }, { unique: true });


module.exports = mongoose.model('TimetableSlot', timetableSlotSchema);