
const express = require("express");
const router = express.Router();

const {
  getEmailLogs,
  getEmailLogById,
} = require("../controllers/emailLogController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// Only logged-in Admin can access email logs
router.use(protect, allowRoles("admin"));

// Get email logs
router.get("/", getEmailLogs);

// Get one email log
router.get("/:id", getEmailLogById);

module.exports = router;
