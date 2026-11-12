
const Notification = require("../models/Notification");

// ===============================
// GET MY NOTIFICATIONS
// ===============================
const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(req.query.limit) || 20)
    );

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate("visitor", "name visitorId")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Notification.countDocuments({
        recipient: req.user._id,
      }),

      Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// GET UNREAD COUNT
// ===============================
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// MARK SINGLE NOTIFICATION AS READ
// ===============================
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();

      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// MARK ALL NOTIFICATIONS AS READ
// ===============================
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// DELETE NOTIFICATION
// ===============================
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
