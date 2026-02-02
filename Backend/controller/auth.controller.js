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
  res.cookie("token", token);

  

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
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

    res.cookie("token", token);

    return res.status(200).json({
      message: "user login successfully",
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName
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
  res.clearCookie("token");
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

module.exports={
  registerUser,
  loginUser,
  logoutUser,
  allUser
}