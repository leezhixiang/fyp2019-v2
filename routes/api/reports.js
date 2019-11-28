const express = require('express');
const router = express.Router();

// controllers
const reportsController = require('../../controllers/reports');

// @route   GET /api/reports/hoster/
// @desc    fetch all hoster reports
// @access  private users
router.get('/hoster', reportsController.getHosterReports);

// @route   GET /api/reports/hoster/:reportId
// @desc    get hoster report
// @access  private users
router.get('/hoster/:reportId', reportsController.getHosterReportDetails);

// @route   GET /api/reports/player/
// @desc    fetch all player reports
// @access  private users
router.get('/player', reportsController.getPlayerReports);

// @route   GET /api/reports/player/:reportId
// @desc    get player report
// @access  private users
router.get('/player/:reportId', reportsController.getPlayerReportDetails);

module.exports = router;