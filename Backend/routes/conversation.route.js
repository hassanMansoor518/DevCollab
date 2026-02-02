const express = require('express');
const { getOrCreateConversation } = require('../controller/conversation.controller');
const secureRoute = require('../middleware/secureRoute');

const router = express.Router();

router.get('/get-or-create/:id', secureRoute, getOrCreateConversation);

module.exports = router;