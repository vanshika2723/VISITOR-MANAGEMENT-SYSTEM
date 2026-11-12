
const express = require("express");
const router = express.Router();

const {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// All routes require authentication
router.use(protect);

// Get active employees for visitor host selection
router.get("/hosts", async (req, res, next) => {
  try {
    const User = require("../models/User");

    const hosts = await User.find({
      role: "employee",
      isActive: true,
    })
      .select("_id name email department")
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: hosts.length,
      hosts,
    });
  } catch (error) {
    next(error);
  }
});

// Remaining user management routes are Admin-only
router.use(allowRoles("admin"));

// Get all users
router.get("/", getUsers);

// Create a new user
router.post("/", createUser);

// Update user details
router.put("/:id", updateUser);

// Deactivate user
router.patch("/:id/deactivate", deactivateUser);

module.exports = router;
