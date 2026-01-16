const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  getAllSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  getAllEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  parseFromFile,
  createFromParsedData,
  getTeachers,
  getSubjects,
  getClasses,
  createClass,
  deleteAllClasses,
  getOrCreateTeacherSubject
} = require('../../controllers/Admin/timetableControllers');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'timetable-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Excel, and image files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Slot routes
router.get('/slots', getAllSlots);
router.post('/slots', createSlot);
router.put('/slots/:id', updateSlot);
router.delete('/slots/:id', deleteSlot);

// Entry routes
router.get('/entries', getAllEntries);
router.post('/entries', createEntry);
router.put('/entries/:id', updateEntry);
router.delete('/entries/:id', deleteEntry);

// AI parsing routes
router.post('/parse-file', upload.single('file'), parseFromFile);
router.post('/create-from-parsed', createFromParsedData);

// Helper routes
router.get('/teachers', getTeachers);
router.get('/subjects', getSubjects);
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.delete('/classes', deleteAllClasses);
router.post('/teacher-subject', getOrCreateTeacherSubject);

module.exports = router;
