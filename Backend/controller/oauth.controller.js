const userModel = require("../model/user.model");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// ─── Google OAuth ──────────────────────────────────────────────
async function googleAuth(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Decode the Google ID token (JWT) to get user info
    // The token from Google Identity Services is a JWT we can decode
    const parts = credential.split(".");
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Could not get email from Google" });
    }

    // Check if user already exists
    let user = await userModel.findOne({ email });

    if (user) {
      // User exists — update provider info if needed
      if (user.provider === "local") {
        user.provider = "google";
        user.providerId = googleId;
        user.avatar = picture || user.avatar;
        await user.save();
      }
    } else {
      // Create new user
      user = await userModel.create({
        fullName: name || email.split("@")[0],
        email,
        provider: "google",
        providerId: googleId,
        avatar: picture || null,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie("token", token, {
      sameSite: "none",
      secure: true
    });

    return res.status(200).json({
      message: "Google login successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        techStack: user.techStack,
        notifications: user.notifications,
        appearance: user.appearance,
        aiSettings: user.aiSettings
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
}

// ─── GitHub OAuth ──────────────────────────────────────────────
async function githubAuth(req, res) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "GitHub code is required" });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({ message: "Failed to get GitHub access token" });
    }

    // Get GitHub user info
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;

    // Get primary email (sometimes email is private)
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const primaryEmail = emailsResponse.data.find(
        (e) => e.primary && e.verified
      );
      email = primaryEmail ? primaryEmail.email : null;
    }

    if (!email) {
      return res
        .status(400)
        .json({ message: "Could not get email from GitHub. Please make your email public on GitHub." });
    }

    // Check if user already exists
    let user = await userModel.findOne({ email });

    if (user) {
      // User exists — update provider info if needed
      if (user.provider === "local") {
        user.provider = "github";
        user.providerId = String(githubUser.id);
        user.avatar = githubUser.avatar_url || user.avatar;
        await user.save();
      }
    } else {
      // Create new user
      user = await userModel.create({
        fullName: githubUser.name || githubUser.login,
        email,
        provider: "github",
        providerId: String(githubUser.id),
        avatar: githubUser.avatar_url || null,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie("token", token, {
      sameSite: "none",
      secure: true
    });

    return res.status(200).json({
      message: "GitHub login successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        techStack: user.techStack,
        notifications: user.notifications,
        appearance: user.appearance,
        aiSettings: user.aiSettings
      },
    });
  } catch (error) {
    console.error("GitHub Auth Error:", error);
    return res.status(500).json({ message: "GitHub authentication failed" });
  }
}

module.exports = {
  googleAuth,
  githubAuth,
};
