const express = require('express');
const router = express.Router();

// data model
const PlayerReport = require('../../models/mongoose/player_report');

// @GET /api/player-reports
router.get('/', (req, res) => {
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

// @GET /api/player-reports/:playerReportId
router.get('/:playerReportId', (req, res) => {
    PlayerReport.find({ "_id": req.params.playerReportId })
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