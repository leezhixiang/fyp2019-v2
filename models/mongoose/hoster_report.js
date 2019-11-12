const mongoose = require('mongoose')

const User = require('./user')
const Quiz = require('./quiz')

const PlayerResultsSchema = new mongoose.Schema({
    name: {
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
    accuracy: {
        type: Number,
        default: 0
    }
})

const ChoiceSchema = new mongoose.Schema({
    choice_id: mongoose.Schema.Types.ObjectId,
    choice_num: {
        type: Number,
        default: 0
    },
    choice: {
        type: String,
        required: true
    },
    is_correct: {
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
    question_num: {
        type: Number,
        default: 0
    },
    question: {
        type: String,
        required: true
    },
    accuracy: {
        type: Number,
        default: 0
    },
    choices: {
        type: [ChoiceSchema]
    },
})

const LeaderboardSchema = new mongoose.Schema({
    display_name: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        default: 0
    }
})

const HosterReportSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    socket_id: {
        type: String,
        required: true
    },
    game_id: {
        type: String,
        required: true
    },
    hoster: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hosted_date: {
        type: Date,
        default: Date.now
    },
    game_name: {
        type: String,
        required: true
    },
    accuracy: {
        type: Number,
        default: 0
    },
    players: {
        type: Number,
        default: 0
    },
    leaderboard: {
        type: [LeaderboardSchema],
    },
    questions: {
        type: [QuestionSchema]
    },
    players: [PlayerResultsSchema]
})



module.exports = mongoose.model('HosterReport', HosterReportSchema, 'hoster_reports')