const express = require('express');
const router = express.Router();

// data model
const Quiz = require('../../models/mongoose/quiz');

// @POST /api/quizzes
router.post('/', (req, res) => {
    const quiz = new Quiz({
        title: req.body.title,
        creator: req.body.creator,
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
})

// @GET /api/quizzes/:quizId
router.get('/:quizId', function(req, res) {
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