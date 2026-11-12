
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: [
        "visitor_registration",
        "approval_request",
        "approval_approved",
        "approval_rejected",
        "visitor_checkin",
        "visitor_checkout",
        "system",
        "security",
      ],
      default: "system",
    },

    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    actionUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Notification listing indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
