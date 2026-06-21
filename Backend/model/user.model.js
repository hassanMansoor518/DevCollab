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
    },
    bio: {
        type: String,
        default: ""
    },
    techStack: {
        type: [String],
        default: []
    },
    notifications: {
        workspaceUpdates: { type: Boolean, default: true },
        directMessages: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        emailDigest: { type: Boolean, default: false },
        pushNotifications: { type: Boolean, default: true }
    },
    appearance: {
        compactMode: { type: Boolean, default: false },
        animations: { type: Boolean, default: true }
    },
    aiSettings: {
        openaiKey: { type: String, default: "" },
        geminiKey: { type: String, default: "" },
        defaultModel: { type: String, default: "Gemini 1.5 Flash" },
        contextAware: { type: Boolean, default: true },
        autoSummarize: { type: Boolean, default: false }
    }
}, 
  
    {
        timestamps: true
    }
)

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;