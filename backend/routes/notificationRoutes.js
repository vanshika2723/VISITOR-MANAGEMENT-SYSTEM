
const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

// All notification routes require login
router.use(protect);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark all notifications as read
router.patch("/read-all", markAllAsRead);

// Get logged-in user's notifications
router.get("/", getNotifications);

// Mark one notification as read
router.patch("/:id/read", markAsRead);

// Delete one notification
router.delete("/:id", deleteNotification);

module.exports = router;
