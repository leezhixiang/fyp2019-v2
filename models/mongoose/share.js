const mongoose = require('mongoose');
const User = require('./user');
const Quiz = require('./quiz');

const ShareSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    }
});

module.exports = mongoose.model('Share', ShareSchema, 'shares')