const authController = require('../controller/auth.controller')
const oauthController = require('../controller/oauth.controller')
const express = require("express");
const secureRoute = require("../middleware/secureRoute");

const router = express.Router();

router.post("/user/register",authController.registerUser)
router.post("/user/login", authController.loginUser )
router.post("/user/logout", authController.logoutUser )

// OAuth Routes
router.post("/oauth/google", oauthController.googleAuth)
router.post("/oauth/github", oauthController.githubAuth)

router.get("/alluser", secureRoute, authController.allUser)
router.put("/user/update-profile", secureRoute, authController.updateUserProfile)
router.put("/user/update-password", secureRoute, authController.updateUserPassword)
router.delete("/user/delete-account", secureRoute, authController.deleteUserAccount)

module.exports = router;
