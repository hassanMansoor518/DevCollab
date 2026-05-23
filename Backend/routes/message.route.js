const express = require('express');
const { sendMessage, getMessage, updateMessage, deleteMessage } = require('../controller/message.controller');
const secureRoute = require('../middleware/secureRoute');

const route = express.Router();

route.post("/send/:id" , secureRoute, sendMessage);
route.get("/get/:id" , secureRoute, getMessage);

// Update a message
route.put('/:messageId', secureRoute, updateMessage);

// Delete a message
route.delete('/:messageId', secureRoute, deleteMessage);

module.exports = route;