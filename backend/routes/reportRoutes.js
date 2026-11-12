
const express = require("express");
const router = express.Router();

const {
  getVisitorReport,
  exportVisitorReport,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// All report routes require login
router.use(protect);

// Get visitor report
router.get(
  "/visitors",
  allowRoles("admin", "receptionist", "employee"),
  getVisitorReport
);

// Export visitor report as CSV
router.get(
  "/visitors/export",
  allowRoles("admin", "receptionist", "employee"),
  exportVisitorReport
);

module.exports = router;
