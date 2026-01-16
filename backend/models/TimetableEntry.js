const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  teacher_subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherSubject', required: true },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  day_of_week: { type: Number, min: 1, max: 7, required: true },
  slot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TimetableSlot', required: true },
  room_label: { type: String },
  session_type: { type: String, enum: ['LECTURE', 'LAB', 'TUTORIAL', 'Online'], required: true },
  valid_from: { type: Date, required: true },
  valid_to: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

timetableEntrySchema.index({ class_id: 1, day_of_week: 1, slot_id: 1 }, { unique: true });
timetableEntrySchema.index({ teacher_subject_id: 1 });
timetableEntrySchema.index({ class_id: 1, day_of_week: 1 });
timetableEntrySchema.index({ valid_from: 1, valid_to: 1 });

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema);