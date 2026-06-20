const express = require("express");
const router = express.Router();
const { createSupportTicket, getSupportTickets } = require("../controller/support.controller");
const secureRoute = require("../middleware/secureRoute");

router.post("/", secureRoute, createSupportTicket);
router.get("/", secureRoute, getSupportTickets);

module.exports = router;
