const express = require('express');
const router = express.Router();
const { login } = require('../../controllers/Teacher/authControllers');

router.post('/login', login);

module.exports = router;
