
const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// All settings routes require Admin access
router.use(protect, allowRoles("admin"));

// Get company settings
router.get("/", getSettings);

// Update company settings
router.put("/", updateSettings);

module.exports = router;
