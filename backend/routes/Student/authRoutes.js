const express = require('express');
const router = express.Router();
const { login } = require('../../controllers/Student/authControllers');

router.post('/login', login);

module.exports = router;
