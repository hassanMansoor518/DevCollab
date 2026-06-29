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
  ],
  userSettings: {
    type: Map,
    of: new mongoose.Schema({
      isPinned: { type: Boolean, default: false },
      isMuted: { type: Boolean, default: false },
      isBlocked: { type: Boolean, default: false }
    }, { _id: false }),
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);