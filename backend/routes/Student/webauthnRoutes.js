const express = require('express');
const router = express.Router();
const webauthnController = require('../../controllers/Student/webauthnController');

// Enrollment routes
router.post('/register/options', webauthnController.generateRegistrationOptions);
router.post('/register/verify', webauthnController.verifyRegistration);

// Authentication routes (for attendance)
router.post('/authenticate/options', webauthnController.generateAuthenticationOptions);
router.post('/authenticate/verify', webauthnController.verifyAuthentication);

// Management routes
router.get('/credentials/:student_id', webauthnController.getEnrolledCredentials);
router.delete('/credentials/:credential_id', webauthnController.removeCredential);

module.exports = router;