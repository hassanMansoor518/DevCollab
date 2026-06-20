const userModel = require("../model/user.model");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

async function registerUser(req, res) {
  try {
    console.log("REQ BODY:", req.body);

    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const userExist = await userModel.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      fullName,
      email,
      password: hashedPassword,
    });

  const token = jwt.sign({
    id: user._id
  }, process.env.JWT_SECRET);
  res.cookie("token", token, {
    sameSite: "none",
    secure: true
  });

  

    return res.status(201).json({
      message: "User registered successfully",
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
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
}



async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({
      email
    });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }
    const token = jwt.sign({
      id: user._id
    }, process.env.JWT_SECRET);

    res.cookie("token", token, {
      sameSite: "none",
      secure: true
    });

    return res.status(200).json({
      message: "user login successfully",
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        techStack: user.techStack,
        notifications: user.notifications,
        appearance: user.appearance,
        aiSettings: user.aiSettings
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
}

function logoutUser(req, res) {
  res.clearCookie("token", {
    sameSite: "none",
    secure: true
  });
  res.status(200).json({
    message: "User is logout"
  })
}


async function allUser(req ,res){
  try {
    const loggedInUserId = req.user._id;
    const users = await userModel.find({
     _id: { $ne: loggedInUserId }
   }).select("-password");
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({
      message:"Server error"
    })
  }
}

async function updateUserProfile(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, bio, techStack, avatar, notifications, appearance, aiSettings } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (techStack !== undefined) user.techStack = techStack;
    if (avatar !== undefined) user.avatar = avatar;
    if (notifications !== undefined) user.notifications = notifications;
    if (appearance !== undefined) user.appearance = appearance;
    if (aiSettings !== undefined) user.aiSettings = aiSettings;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
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
      }
    });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateUserPassword(req, res) {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current password and new password are required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in updateUserPassword:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteUserAccount(req, res) {
  try {
    const userId = req.user._id;
    const user = await userModel.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.clearCookie("token", {
      sameSite: "none",
      secure: true
    });

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUserAccount:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports={
  registerUser,
  loginUser,
  logoutUser,
  allUser,
  updateUserProfile,
  updateUserPassword,
  deleteUserAccount
}