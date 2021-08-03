const mongoose = require('mongoose');
const Degree = require('./degree');
const Schema = mongoose.Schema;

const opts = { toJSON: { virtuals: true } };
const userSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    telephonNumber: {
        type: Number,
        required: true
    },
    email: {
        type: String,
    },
    degrees: [{
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

}, opts)

const Product = mongoose.model('Visitor', userSchema);

module.exports = Product;