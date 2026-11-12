
const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Visitor name is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    reason: {
      type: String,
      required: [true, "Blacklist reason is required"],
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["blocked", "unblocked"],
      default: "blocked",
    },

    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    unblockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    blockedAt: {
      type: Date,
      default: Date.now,
    },

    unblockedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast phone number lookup
blacklistSchema.index({ phone: 1, status: 1 });

// Index for blocked visitors
blacklistSchema.index({ status: 1, blockedAt: -1 });

module.exports = mongoose.model("Blacklist", blacklistSchema);
