
const express = require("express");
const router = express.Router();

const {
  approveVisitor,
  rejectVisitor,
  checkInVisitor,
  checkOutVisitor,
} = require("../controllers/visitorWorkflowController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// All workflow routes require login
router.use(protect);

// Approve visitor
router.patch(
  "/:id/approve",
  allowRoles("admin", "employee"),
  approveVisitor
);

// Reject visitor
router.patch(
  "/:id/reject",
  allowRoles("admin", "employee"),
  rejectVisitor
);

// Check-in visitor
router.patch(
  "/:id/check-in",
  allowRoles("admin", "receptionist"),
  checkInVisitor
);

// Check-out visitor
router.patch(
  "/:id/check-out",
  allowRoles("admin", "receptionist"),
  checkOutVisitor
);

module.exports = router;
