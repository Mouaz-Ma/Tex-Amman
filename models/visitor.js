const mongoose = require('mongoose');
const Degree = require('./degree');
const Schema = mongoose.Schema;


const userSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    telephonNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
    },
    degree: [{
        type : Schema.Types.ObjectId,
        ref: 'Degree'
    }],
    updated: { 
        type: Date,
        default: Date.now 
    },
    attended: {
        type: Boolean,
        default: false
    },
    seenBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }

})

module.exports = mongoose.model('Visitor', userSchema);