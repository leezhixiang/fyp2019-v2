const mongoose = require('mongoose')
const Quiz = require('./quiz')

const UserSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    favorites: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Quiz'
    }],
    shared: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Quiz'
    }]
})

module.exports = mongoose.model('User', UserSchema, 'users')