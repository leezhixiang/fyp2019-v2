const express = require('express');
const router = express.Router();

// data model
const HosterReport = require('../../models/mongoose/hoster_report');
const PlayerReport = require('../../models/mongoose/player_report');

// @route   GET /api/reports/hoster/
// @desc    fetch all hoster reports
// @access  private
router.get('/hoster', (req, res) => {
    HosterReport.find({ "hoster": req.payload.userData._id })
        .populate({
            path: 'hoster',
            select: 'name'
        })
        .then(hosterReport => {
            res.status(200).json(hosterReport)
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

// @route   GET /api/reports/hoster/:reportId
// @desc    get hoster report
// @access  private
router.get('/hoster/:reportId', (req, res) => {
    HosterReport.findOne({ "_id": req.params.reportId })
        .populate({
            path: 'hoster',
            select: 'name'
        })
        .then(hosterReport => {
            PlayerReport.find({ "hoster_report_id": hosterReport._id })
                .populate({
                    path: 'player',
                    select: 'name'
                })
                .then(playerReport => {
                    console.log(playerReport);
                    res.status(200).json({
                        hosterReport,
                        playerReport
                    })
                })
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

// @route   GET /api/reports/player/
// @desc    fetch all player reports
// @access  private
router.get('/player', (req, res) => {
    console.log(req.payload.userData)
    PlayerReport.find({ "player": req.payload.userData._id })
        .populate({
            path: 'player',
            select: 'name'
        })
        .then(playerReport => {
            console.log(playerReport)
            res.status(200).json(playerReport)
        })
        .catch(err => {
            res.status(500).json(err);
        });
})

// @route   GET /api/reports/player/:reportId
// @desc    get player report
// @access  private
router.get('/player/:reportId', (req, res) => {
    PlayerReport.findOne({ "_id": req.params.reportId })
        .populate({
            path: 'player',
            select: 'name'
        })
        .then(playerReport => {
            res.status(200).json(playerReport)
        })
        .catch(err => {
            res.status(500).json(err);
        });
})
module.exports = router;