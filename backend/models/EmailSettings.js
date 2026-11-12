
const mongoose = require("mongoose");

const emailSettingsSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: "smtp",
    },

    smtpHost: {
      type: String,
      required: true,
      trim: true,
    },

    smtpPort: {
      type: Number,
      required: true,
      default: 587,
    },

    smtpUser: {
      type: String,
      required: true,
      trim: true,
    },

    smtpPassword: {
      type: String,
      required: true,
      select: false,
    },

    secure: {
      type: Boolean,
      default: false,
    },

    senderName: {
      type: String,
      default: "Visitor Management System",
      trim: true,
    },

    isEnabled: {
      type: Boolean,
      default: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "EmailSettings",
  emailSettingsSchema
);
