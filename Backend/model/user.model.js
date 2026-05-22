const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
    },
    confirmPassword: {
        type: String,
    },
    provider: {
        type: String,
        enum: ['local', 'google', 'github'],
        default: 'local'
    },
    providerId: {
        type: String,
        default: null
    },
    avatar: {
        type: String,
        default: null
    }


}, 
  
    {
        timestamps: true
    }
)

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;