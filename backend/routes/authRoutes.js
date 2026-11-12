
const express = require("express");
const router = express.Router();

const {
  login,
  getMe,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// Public login route
router.post("/login", login);

// Protected routes
router.get("/me", protect, getMe);
router.patch("/change-password", protect, changePassword);

module.exports = router;
