const mongoose = require('mongoose')
const User = require('./user')

const ClassSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
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
    member: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
})

module.exports = mongoose.model('Class', ClassSchema, 'classes')