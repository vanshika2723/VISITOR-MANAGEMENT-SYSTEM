
const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
} = require("../controllers/dashboardController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// Dashboard requires login
router.use(protect);

// Dashboard statistics
router.get(
  "/stats",
  allowRoles("admin", "receptionist", "employee"),
  getDashboardStats
);

module.exports = router;
