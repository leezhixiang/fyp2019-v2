const mongoose = require('mongoose')
const User = require('./user')

const ChoiceSchema = new mongoose.Schema({
    choice: {
        type: String,
        required: true
    },
    is_correct: {
        type: Boolean,
        required: true
    }
})

const QuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    choices: {
        type: [ChoiceSchema],
        required: true
    },
    timer: {
        type: Number,
        required: true
    }
})

const QuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plays: {
        type: Number,
        default: 0
    },
    questions: {
        type: [QuestionSchema],
        required: true
    }
})

module.exports = mongoose.model('Quiz', QuizSchema, 'quizzes')