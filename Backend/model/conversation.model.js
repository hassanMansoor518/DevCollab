const mongoose = require('mongoose');
const User = require('./user.model');
const Message = require('./message.model');
const conversationSchema = new mongoose.Schema({
  members: [
    {
    type: mongoose.Schema.Types.ObjectId,
     ref: "User"
  }
],
  messages: [
    {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: []
  }
]
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);