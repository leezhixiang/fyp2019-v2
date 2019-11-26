const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const checkAuth = require('../../middleware/check-auth');
const checkAuthWithoutToken = require('../../middleware/check-auth-no-token');

// data model
const Quiz = require('../../models/mongoose/quiz');
const Favorite = require('../../models/mongoose/favorite');

// Tell Mongoose to use the native Node.js promise library.
mongoose.Promise = global.Promise;

// @GET /api/quizzes
router.get('/', (req, res) => {
    Quiz.find()
        .populate('creator', 'name')
        .then(quizzes => {
            res.status(200).json(quizzes)
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

// @GET /api/quizzes/:quizId
router.get('/:quizId', checkAuthWithoutToken, function(req, res) {
    if (!req.payload) {
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
    } else {
        const promises = [
            // Call .exec() on each query without a callback to return its promise.
            Quiz.findById(req.params.quizId).populate('creator', 'name').exec(),
            Favorite.findOne({ user_id: req.payload.userData._id, quiz_id: req.params.quizId }).exec()
        ];

        Promise.all(promises)
            .then((results) => {
                // results is an array of the results of each promise, in order.
                console.log(results);
                const quiz = results[0];
                const favorite = results[1];
                if (!quiz) {
                    return res.status(404).json({
                        message: "Quiz not found"
                    });
                };
                if (!favorite) {
                    res.status(200).json({
                        quiz,
                        isFavorited: false
                    });
                } else {
                    res.status(200).json({
                        quiz,
                        isFavorited: true
                    });
                }
            }).catch((err) => {
                res.status(500).json(err);
            });
    };
});

// @POST /api/quizzes
router.post('/', checkAuth, (req, res) => {
    const quiz = new Quiz({
        title: req.body.title,
        creator: req.payload.userData._id,
        questions: req.body.questions
    });

    quiz.save()
        .then((quiz) => {
            res.status(201).json(quiz);
        })
        .catch((err) => {
            res.status(500).json(err);
        });
});

module.exports = router;