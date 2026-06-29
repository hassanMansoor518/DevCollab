const express = require('express');
const { getOrCreateConversation, updateUserSettings, clearConversationHistory } = require('../controller/conversation.controller');
const secureRoute = require('../middleware/secureRoute');

const router = express.Router();

router.get('/get-or-create/:id', secureRoute, getOrCreateConversation);
router.put('/:id/settings', secureRoute, updateUserSettings);
router.delete('/:id/history', secureRoute, clearConversationHistory);

module.exports = router;