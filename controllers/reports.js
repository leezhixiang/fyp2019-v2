// data model
const HosterReport = require('../models/mongoose/hoster_report');
const PlayerReport = require('../models/mongoose/player_report');

exports.getHosterReports = (req, res) => {
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
}

exports.getHosterReportDetails = (req, res) => {
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
                    res.status(200).json({
                        hosterReport,
                        playerReport
                    })
                })
                .catch(err => {
                    res.status(500).json(err);
                });
        })
        .catch(err => {
            res.status(500).json(err);
        });
}

exports.getPlayerReports = (req, res) => {
    console.log(req.payload.userData)
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
}

exports.getPlayerReportDetails = (req, res) => {
    PlayerReport.findOne({ "_id": req.params.reportId })
        .populate({
            path: 'player',
            select: 'name'
        })
        .then(playerReport => {
            res.status(200).json(playerReport)
        })
        .catch(err => {
            console.log(err)
            res.status(500).json(err);
        });
}