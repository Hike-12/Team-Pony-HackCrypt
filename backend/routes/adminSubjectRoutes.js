const express = require('express');
const router = express.Router();
const adminSubjectController = require('../controllers/Admin/adminSubjectController');

router.get('/', adminSubjectController.getAllSubjects);
router.post('/', adminSubjectController.createSubject);
router.get('/:id', adminSubjectController.getSubjectById);
router.put('/:id', adminSubjectController.updateSubject);
router.delete('/:id', adminSubjectController.deleteSubject);

module.exports = router;
