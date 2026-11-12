
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
      index: true,
    },

    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
      required: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "pending",
        "approved",
        "rejected",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      default: "pending",
    },

    meetingLocation: {
      type: String,
      default: "Main Office",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Generate appointment ID
appointmentSchema.pre("validate", function () {
  if (!this.appointmentId) {
    this.appointmentId =
      "APT-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  if (
    this.startTime &&
    this.endTime &&
    this.endTime <= this.startTime
  ) {
    this.invalidate("endTime", "End time must be after start time");
  }
});

// Useful indexes
appointmentSchema.index({ host: 1, appointmentDate: 1 });
appointmentSchema.index({ visitor: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
