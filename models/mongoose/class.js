const mongoose = require('mongoose')
const User = require('./user')

const ClassSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    section: {
        type: String
    },
    tutorial_group: {
        type: String
    },
    class_id: {
        type: String,
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
})

module.exports = mongoose.model('Class', ClassSchema, 'classes')