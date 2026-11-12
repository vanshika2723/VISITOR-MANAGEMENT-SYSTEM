
const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      default: "",
    },

    emailType: {
      type: String,
      enum: [
        "visitor_registration",
        "appointment_confirmation",
        "approval",
        "rejection",
        "checkin",
        "checkout",
        "appointment_reminder",
        "password_reset",
        "system",
      ],
      default: "system",
    },

    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },

    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    errorMessage: {
      type: String,
      default: "",
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ recipient: 1 });

module.exports = mongoose.model("EmailLog", emailLogSchema);
