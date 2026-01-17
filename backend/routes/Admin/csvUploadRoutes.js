const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadSubjectsCSV, uploadTeachersCSV, uploadStudentsCSV } = require('../../controllers/csvUploadController');
// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

// Upload subjects CSV
router.post('/subjects/upload-csv', upload.single('file'), uploadSubjectsCSV);

// Upload teachers CSV
router.post('/teachers/upload-csv', upload.single('file'), uploadTeachersCSV);

// Upload students CSV
router.post('/students/upload-csv', upload.single('file'), uploadStudentsCSV);

module.exports = router;
