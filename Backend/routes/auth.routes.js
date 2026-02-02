const authController = require('../controller/auth.controller')
const express = require("express");
const secureRoute = require("../middleware/secureRoute");

const router = express.Router();

router.post("/user/register",authController.registerUser)
router.post("/user/login", authController.loginUser )
router.post("/user/logout", authController.logoutUser )

router.get("/alluser", secureRoute, authController.allUser)


module.exports = router;
