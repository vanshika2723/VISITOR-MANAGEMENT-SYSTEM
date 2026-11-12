
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const logActivity = require("../utils/activityLogger");

// Generate JWT Token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

// Remove sensitive fields before sending response
const getSafeUser = (user) => {
  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.__v;

  return safeUser;
};

// ===============================
// LOGIN
// ===============================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact administrator.",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    // Make user available to Activity Logger
    req.user = user;

    await logActivity({
      req,
      action: "LOGIN",
      description: `${user.name} logged into the system.`,
      targetUser: user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: getSafeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// GET CURRENT USER
// ===============================
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: getSafeUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// CHANGE PASSWORD
// ===============================
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const isPasswordCorrect = await user.comparePassword(
      currentPassword
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    await logActivity({
      req,
      action: "PASSWORD_CHANGED",
      description: `${user.name} changed their password.`,
      targetUser: user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  changePassword,
};
