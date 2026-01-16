const express = require('express');
const router = express.Router();
const adminTeacherSubjectController = require('../controllers/Admin/adminTeacherSubjectController');

router.get('/', adminTeacherSubjectController.getAllAssignments);
router.post('/', adminTeacherSubjectController.createAssignment);
router.get('/:id', adminTeacherSubjectController.getAssignmentById);
router.delete('/:id', adminTeacherSubjectController.deleteAssignment);
router.get('/teacher/:teacher_id', adminTeacherSubjectController.getTeacherAssignments);

module.exports = router;
