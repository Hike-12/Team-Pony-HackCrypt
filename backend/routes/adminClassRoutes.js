const express = require('express');
const router = express.Router();
const adminClassController = require('../controllers/Admin/adminClassController');

router.get('/', adminClassController.getAllClasses);
router.post('/', adminClassController.createClass);
router.get('/:id', adminClassController.getClassById);
router.put('/:id', adminClassController.updateClass);
router.delete('/:id', adminClassController.deleteClass);

module.exports = router;
