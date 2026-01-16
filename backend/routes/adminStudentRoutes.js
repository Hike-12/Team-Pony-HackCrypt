const express = require('express');
const router = express.Router();
const adminStudentController = require('../controllers/admin/adminStudentController');

router.get('/', adminStudentController.getAllStudents);
router.post('/', adminStudentController.createStudent);
router.get('/:id', adminStudentController.getStudentById);
router.put('/:id', adminStudentController.updateStudent);
router.delete('/:id', adminStudentController.deleteStudent);

module.exports = router;