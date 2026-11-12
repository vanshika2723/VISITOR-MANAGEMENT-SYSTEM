
const express = require("express");
const router = express.Router();

const { getAnalyticsSummary } = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.get(
  "/summary",
  protect,
  allowRoles("admin"),
  getAnalyticsSummary
);

module.exports = router;
