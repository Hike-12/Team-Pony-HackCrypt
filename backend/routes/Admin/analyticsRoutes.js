const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/Admin/adminAnalyticsController');

// GET analytics overview
router.get('/overview', analyticsController.getAnalyticsOverview);

module.exports = router;
