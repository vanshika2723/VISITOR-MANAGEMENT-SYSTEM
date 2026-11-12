
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "USER_CREATED",
        "USER_UPDATED",
        "USER_DEACTIVATED",
        "VISITOR_REGISTERED",
        "VISITOR_UPDATED",
        "VISITOR_DELETED",
        "VISITOR_APPROVED",
        "VISITOR_REJECTED",
        "VISITOR_CHECKED_IN",
        "VISITOR_CHECKED_OUT",
        "VISITOR_VERIFIED",
        "VISITOR_BLACKLISTED",
        "VISITOR_UNBLOCKED",
        "REPORT_EXPORTED",
        "PASSWORD_CHANGED",
        "OTHER"
      ],
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    performedByName: {
      type: String,
      default: "System",
      trim: true,
    },

    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
      default: null,
    },

    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    ipAddress: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Latest activity first
activitySchema.index({ createdAt: -1 });

// User activity history
activitySchema.index({ performedBy: 1, createdAt: -1 });

// Visitor activity history
activitySchema.index({ visitor: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
