
const express = require("express");
const router = express.Router();

const {
  verifyVisitorPass,
} = require("../controllers/qrController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// QR verification requires login and authorized role
router.use(protect, allowRoles("admin", "receptionist"));

// Verify visitor QR pass
router.get("/verify/:token", verifyVisitorPass);

module.exports = router;
