
const Notification = require("../models/Notification");
const { getIO } = require("./socket");

const createNotification = async ({
  recipient,
  title,
  message,
  type = "system",
  visitor = null,
  actionUrl = "",
}) => {
  try {
    if (!recipient || !title || !message) {
      console.error("Notification requires recipient, title and message.");
      return null;
    }

    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      visitor,
      actionUrl,
    });

    // Emit notification to the recipient's private room
    try {
      const io = getIO();

      io.to(`user:${recipient.toString()}`).emit(
        "newNotification",
        notification
      );
    } catch (socketError) {
      console.error("Socket notification error:", socketError.message);
    }

    return notification;
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
};

module.exports = createNotification;
