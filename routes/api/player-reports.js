const express = require('express');
const router = express.Router();

// data model
const playerReport = require('../../models/mongoose/player_report');

// @GET /api/player-reports
router.get('/', (req, res) => {
    Quiz.find()
        .populate('creator', 'name')
        .then(quizzes => {
            res.status(200).json(quizzes)
        })
        .catch(err => {
            res.status(500).json(err);
        });
})

// @GET /api/player-reports/:playerReportId
router.get('/:playerReportId', (req, res) => {
    Quiz.findById(req.params.quizId)
        .populate('creator', 'name')
        .then(quiz => {
            if (!quiz) {
                return res.status(404).json({
                    message: "Quiz not found"
                });
            }
            res.status(200).json(quiz);
        })
        .catch(err => {
            res.status(500).json(err);
        });
})

module.exports = router;