
const express = require("express");
const router = express.Router();

const {
  getActivityLogs,
} = require("../controllers/activityController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.get(
  "/",
  protect,
  allowRoles("admin"),
  getActivityLogs
);

module.exports = router;
