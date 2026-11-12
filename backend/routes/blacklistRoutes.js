
const express = require("express");
const router = express.Router();

const {
  addToBlacklist,
  getBlacklist,
  unblockVisitor,
} = require("../controllers/blacklistController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// All blacklist routes require Admin access
router.use(protect, allowRoles("admin"));

// Get blacklist records
router.get("/", getBlacklist);

// Add visitor to blacklist
router.post("/", addToBlacklist);

// Unblock visitor
router.patch("/:id/unblock", unblockVisitor);

module.exports = router;
