const express = require('express');
const router = express.Router();
// data model
const HosterReport = require('../../models/mongoose/hoster_report');
const PlayerReport = require('../../models/mongoose/player_report');

// @GET /api/reports/hoster/
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

// @GET /api/reports/hoster/:reportId
router.get('/hoster/:reportId', (req, res) => {
    HosterReport.find({ "_id": req.params.reportId })
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

// @GET /api/reports/player/
router.get('/player', (req, res) => {
    PlayerReport.find({ "player": req.payload.userData._id })
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

// @GET /api/reports/player/:reportId
router.get('/player/:reportId', (req, res) => {
    PlayerReport.find({ "_id": req.params.reportId })
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