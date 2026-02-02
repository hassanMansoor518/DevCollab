const express = require('express');
const { sendMessage, getMessage } = require('../controller/message.controller');
const secureRoute = require('../middleware/secureRoute');

const route = express.Router();

route.post("/send/:id" , secureRoute, sendMessage);
route.get("/get/:id" , secureRoute, getMessage);

module.exports = route;