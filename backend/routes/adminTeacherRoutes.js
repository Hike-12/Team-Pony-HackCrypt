const express = require('express');
const router = express.Router();
const adminTeacherController = require('../controllers/admin/adminTeacherController');

router.get('/', adminTeacherController.getAllTeachers);
router.post('/', adminTeacherController.createTeacher);
router.get('/:id', adminTeacherController.getTeacherById);
router.put('/:id', adminTeacherController.updateTeacher);
router.delete('/:id', adminTeacherController.deleteTeacher);

module.exports = router;