const express = require('express');
const router = express.Router();

// data model
const HosterReport = require('../../models/mongoose/hoster_report');
const User = require('../../models/mongoose/user');

// @GET /api/hoster-reports
router.get('/', (req, res) => {
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
})

// @GET /api/hoster-reports/:hosterReportId
router.get('/:hosterReportId', (req, res) => {

})

module.exports = router;