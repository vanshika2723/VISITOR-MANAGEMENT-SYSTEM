
const User = require("../models/User");
const logActivity = require("../utils/activityLogger");

// Remove sensitive fields
const safeUser = (user) => {
  const data = user.toObject();

  delete data.password;
  delete data.__v;

  return data;
};

// ===============================
// GET ALL USERS
// ===============================
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// CREATE USER
// ===============================
const createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      department,
      designation,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const allowedRoles = ["admin", "receptionist", "employee"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role.",
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      department,
      designation,
      createdBy: req.user._id,
    });

    await logActivity({
      req,
      action: "USER_CREATED",
      description: `${user.name} was created as ${user.role}.`,
      targetUser: user._id,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// UPDATE USER
// ===============================
const updateUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      role,
      phone,
      department,
      designation,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user._id.equals(req.user._id) && role && role !== user.role) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role.",
      });
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();

      const duplicateUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (duplicateUser) {
        return res.status(409).json({
          success: false,
          message: "This email is already used by another user.",
        });
      }

      user.email = normalizedEmail;
    }

    if (role) {
      const allowedRoles = ["admin", "receptionist", "employee"];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role.",
        });
      }

      user.role = role;
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (designation !== undefined) user.designation = designation;

    await user.save();

    await logActivity({
      req,
      action: "USER_UPDATED",
      description: `${user.name}'s account details were updated.`,
      targetUser: user._id,
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// DEACTIVATE USER
// ===============================
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: "This account is already inactive.",
      });
    }

    user.isActive = false;
    await user.save();

    await logActivity({
      req,
      action: "USER_DEACTIVATED",
      description: `${user.name}'s account was deactivated.`,
      targetUser: user._id,
    });

    return res.status(200).json({
      success: true,
      message: "User account deactivated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
};
