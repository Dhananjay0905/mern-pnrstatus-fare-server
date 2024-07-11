const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    nationality: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
    },

});

const User = mongoose.model('User', UserSchema);

module.exports = User;