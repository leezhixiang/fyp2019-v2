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
    unattempted: {
        type: Number,
        default: 0
    },
    accuracy: {
        type: Number,
        default: 0
    }
})

const ChoiceSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    choice: {
        type: String,
        required: true
    },
    is_correct: {
        type: Boolean,
        required: true
    },
    numPlayers: {
        type: Number,
        default: 0
    },
    accuracy: {
        type: Number,
        default: 0
    }
})

const QuestionSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
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
    numNoAnsPlayers: {
        type: Number,
        default: 0
    },
    noAnsAccuracy: {
        type: Number,
        default: 0
    }
})

const ScoreboardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        default: 0
    }
})

const HosterReportSchema = new mongoose.Schema({
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
    scoreboard: {
        type: [ScoreboardSchema],
    },
    questions: {
        type: [QuestionSchema]
    },
    player_results: {
        type: [PlayerResultsSchema]
    }
});

module.exports = mongoose.model('HosterReport', HosterReportSchema, 'hoster_reports')