const mongoose = require('mongoose')

const User = require('./user')
const Quiz = require('./quiz')

const ChoiceSchema = new mongoose.Schema({
    choice_id: mongoose.Schema.Types.ObjectId,
    choice: {
        type: String,
        required: true
    },
    is_correct: {
        type: Boolean,
        required: true
    },
    is_answer: {
        type: Boolean,
        required: true
    },
    accuracy: {
        type: Number,
        default: 0
    }
})

const QuestionSchema = new mongoose.Schema({
    question_id: mongoose.Schema.Types.ObjectId,
    question: {
        type: String,
        required: true
    },
    choices: {
        type: [ChoiceSchema]
    },
})

const PlayerReportSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    socket_id: {
        type: String,
        required: true
    },
    game_id: {
        type: String,
        required: true
    },
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    played_date: {
        type: Date,
        default: Date.now
    },
    game_name: {
        type: String,
        required: true
    },
    hoster_name: {
        type: String,
        required: true
    },
    correct: {
        type: Number,
        default: 0
    },
    incorrect: {
        type: Number,
        default: 0
    },
    unattempt: {
        type: Number,
        default: 0

    },
    leaderboard: [{
        display_name: {
            type: String
        },
        points: {
            type: Number,
            default: 0
        }
    }],
    questions: {
        type: [QuestionSchema]
    }
})

module.exports = mongoose.model('PlayerReport', PlayerReportSchema, 'player_reports')