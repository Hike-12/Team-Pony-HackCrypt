const express = require('express');
const router = express.Router();
const { login, getProfile } = require('../../controllers/Student/authControllers');

router.post('/login', login);
router.get('/profile/:studentId', getProfile);

module.exports = router;
