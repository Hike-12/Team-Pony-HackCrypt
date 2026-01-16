const TimetableSlot = require('../../models/TimetableSlot');
const TimetableEntry = require('../../models/TimetableEntry');
const TeacherSubject = require('../../models/TeacherSubject');
const Teacher = require('../../models/Teacher');
const Subject = require('../../models/Subject');
const Class = require('../../models/Class');
const { parseTimetableFromFile } = require('../../services/geminiService');
const fs = require('fs');
const path = require('path');

/**
 * Get all timetable slots
 */
exports.getAllSlots = async (req, res) => {
  try {
    const slots = await TimetableSlot.find().sort({ sort_order: 1 });
    res.json({ success: true, data: slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Create a new timetable slot
 */
exports.createSlot = async (req, res) => {
  try {
    const { slot_name, start_time, end_time, sort_order } = req.body;

    const slot = new TimetableSlot({
      slot_name,
      start_time,
      end_time,
      sort_order
    });

    await slot.save();
    res.status(201).json({ success: true, data: slot, message: 'Slot created successfully' });
  } catch (error) {
    console.error('Error creating slot:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Slot with this name or time already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update a timetable slot
 */
exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { slot_name, start_time, end_time, sort_order } = req.body;

    const slot = await TimetableSlot.findByIdAndUpdate(
      id,
      { slot_name, start_time, end_time, sort_order },
      { new: true, runValidators: true }
    );

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    res.json({ success: true, data: slot, message: 'Slot updated successfully' });
  } catch (error) {
    console.error('Error updating slot:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Delete a timetable slot
 */
exports.deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const slot = await TimetableSlot.findByIdAndDelete(id);

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all timetable entries with populated data
 */
exports.getAllEntries = async (req, res) => {
  try {
    const { class_id, teacher_id } = req.query;

    let filter = {};
    if (class_id) filter.class_id = class_id;
    
    // If teacher_id is provided, we need to find all teacher_subject_ids for this teacher first
    if (teacher_id) {
      const teacherSubjects = await TeacherSubject.find({ teacher_id: teacher_id });
      const teacherSubjectIds = teacherSubjects.map(ts => ts._id);
      filter.teacher_subject_id = { $in: teacherSubjectIds };
    }

    const entries = await TimetableEntry.find(filter)
      .populate({
        path: 'teacher_subject_id',
        populate: [
          { path: 'teacher_id', select: 'full_name department' },
          { path: 'subject_id', select: 'code name' },
          { path: 'class_id', select: 'name batch_year division' }
        ]
      })
      .populate('class_id', 'name batch_year division')
      .populate('slot_id', 'slot_name start_time end_time sort_order')
      .sort({ day_of_week: 1, 'slot_id.sort_order': 1 });

    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Create a new timetable entry
 */
exports.createEntry = async (req, res) => {
  try {
    const {
      teacher_subject_id,
      class_id,
      day_of_week,
      slot_id,
      room_label,
      session_type,
      valid_from,
      valid_to
    } = req.body;

    const entry = new TimetableEntry({
      teacher_subject_id,
      class_id,
      day_of_week,
      slot_id,
      room_label,
      session_type,
      valid_from,
      valid_to
    });

    await entry.save();

    const populatedEntry = await TimetableEntry.findById(entry._id)
      .populate({
        path: 'teacher_subject_id',
        populate: [
          { path: 'teacher_id', select: 'full_name department' },
          { path: 'subject_id', select: 'code name' },
          { path: 'class_id', select: 'name batch_year division' }
        ]
      })
      .populate('class_id', 'name batch_year division')
      .populate('slot_id', 'slot_name start_time end_time sort_order');

    res.status(201).json({ success: true, data: populatedEntry, message: 'Entry created successfully' });
  } catch (error) {
    console.error('Error creating entry:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Entry already exists for this class, day, and slot' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update a timetable entry
 */
exports.updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const entry = await TimetableEntry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'teacher_subject_id',
        populate: [
          { path: 'teacher_id', select: 'full_name department' },
          { path: 'subject_id', select: 'code name' },
          { path: 'class_id', select: 'name batch_year division' }
        ]
      })
      .populate('class_id', 'name batch_year division')
      .populate('slot_id', 'slot_name start_time end_time sort_order');

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, data: entry, message: 'Entry updated successfully' });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Delete a timetable entry
 */
exports.deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await TimetableEntry.findByIdAndDelete(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Parse timetable from uploaded file using AI
 */
exports.parseFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Parse the file using Gemini AI
    const parsedData = await parseTimetableFromFile(filePath, mimeType);

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: parsedData,
      message: 'File parsed successfully. Please review and complete any missing information.'
    });
  } catch (error) {
    console.error('Error parsing file:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({ success: false, message: 'Error parsing file', error: error.message });
  }
};

/**
 * Create timetable entries from parsed AI data
 */
exports.createFromParsedData = async (req, res) => {
  try {
    const { slots, entries } = req.body;

    const createdSlots = [];
    const createdEntries = [];
    const errors = [];

    // Create slots
    for (const slotData of slots || []) {
      try {
        const existingSlot = await TimetableSlot.findOne({ slot_name: slotData.slot_name });
        if (existingSlot) {
          createdSlots.push(existingSlot);
        } else {
          const slot = new TimetableSlot(slotData);
          await slot.save();
          createdSlots.push(slot);
        }
      } catch (error) {
        errors.push({ type: 'slot', data: slotData, error: error.message });
      }
    }

    // Create entries
    for (const entryData of entries || []) {
      try {
        // Find or create required entities
        let teacher, subject, classDoc, teacherSubject, slot;

        // Find slot by name
        if (entryData.slot_name) {
          slot = await TimetableSlot.findOne({ slot_name: entryData.slot_name });
        }

        // Find or create subject
        if (entryData.subject_code && entryData.subject_name) {
          subject = await Subject.findOne({ code: entryData.subject_code });
          if (!subject) {
            subject = new Subject({
              code: entryData.subject_code,
              name: entryData.subject_name
            });
            await subject.save();
          }
        }

        // Find or create class
        if (entryData.class_name && entryData.batch_year && entryData.division) {
          classDoc = await Class.findOne({
            name: entryData.class_name,
            batch_year: entryData.batch_year,
            division: entryData.division
          });
          if (!classDoc) {
            classDoc = new Class({
              name: entryData.class_name,
              batch_year: entryData.batch_year,
              division: entryData.division
            });
            await classDoc.save();
          }
        }

        // Find teacher by name
        if (entryData.teacher_name) {
          teacher = await Teacher.findOne({ full_name: entryData.teacher_name });
        }

        // Create teacher-subject mapping if all required data exists
        if (teacher && subject && classDoc) {
          teacherSubject = await TeacherSubject.findOne({
            teacher_id: teacher._id,
            subject_id: subject._id,
            class_id: classDoc._id
          });

          if (!teacherSubject) {
            teacherSubject = new TeacherSubject({
              teacher_id: teacher._id,
              subject_id: subject._id,
              class_id: classDoc._id
            });
            await teacherSubject.save();
          }
        }

        // Create timetable entry if we have all required data
        if (teacherSubject && classDoc && slot && entryData.day_of_week && entryData.session_type) {
          const entry = new TimetableEntry({
            teacher_subject_id: teacherSubject._id,
            class_id: classDoc._id,
            day_of_week: entryData.day_of_week,
            slot_id: slot._id,
            room_label: entryData.room_label,
            session_type: entryData.session_type,
            valid_from: entryData.valid_from || new Date(),
            valid_to: entryData.valid_to || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months
          });

          await entry.save();
          createdEntries.push(entry);
        } else {
          errors.push({
            type: 'entry',
            data: entryData,
            error: 'Missing required data (teacher, subject, class, slot, or session type)'
          });
        }
      } catch (error) {
        errors.push({ type: 'entry', data: entryData, error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        slotsCreated: createdSlots.length,
        entriesCreated: createdEntries.length,
        errors: errors
      },
      message: `Created ${createdSlots.length} slots and ${createdEntries.length} entries${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });
  } catch (error) {
    console.error('Error creating from parsed data:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all teachers
 */
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('user_id', 'email');
    res.json({ success: true, data: teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all subjects
 */
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all classes
 */
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find();
    
    // Get timetable entry counts for each class
    const classesWithTimetableInfo = await Promise.all(
      classes.map(async (cls) => {
        const entryCount = await TimetableEntry.countDocuments({ class_id: cls._id });
        return {
          ...cls.toObject(),
          entry_count: entryCount,
          has_timetable: entryCount > 0
        };
      })
    );
    
    res.json({ success: true, data: classesWithTimetableInfo });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Create a new class
 */
exports.createClass = async (req, res) => {
  try {
    const { name, batch_year, division } = req.body;

    if (!name || batch_year === undefined || !division) {
      return res.status(400).json({ success: false, message: 'Name, batch_year, and division are required' });
    }

    const newClass = new Class({
      name,
      batch_year,
      division
    });

    await newClass.save();
    res.status(201).json({ success: true, data: newClass, message: 'Class created successfully' });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Delete all classes
 */
exports.deleteAllClasses = async (req, res) => {
  try {
    const result = await Class.deleteMany({});
    res.json({ success: true, message: `${result.deletedCount} classes deleted successfully` });
  } catch (error) {
    console.error('Error deleting classes:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get or create teacher-subject mapping
 */
exports.getOrCreateTeacherSubject = async (req, res) => {
  try {
    const { teacher_id, subject_id, class_id } = req.body;

    let teacherSubject = await TeacherSubject.findOne({
      teacher_id,
      subject_id,
      class_id
    });

    if (!teacherSubject) {
      teacherSubject = new TeacherSubject({
        teacher_id,
        subject_id,
        class_id
      });
      await teacherSubject.save();
    }

    teacherSubject = await TeacherSubject.findById(teacherSubject._id)
      .populate('teacher_id', 'full_name department')
      .populate('subject_id', 'code name')
      .populate('class_id', 'name batch_year division');

    res.json({ success: true, data: teacherSubject });
  } catch (error) {
    console.error('Error getting/creating teacher-subject:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
