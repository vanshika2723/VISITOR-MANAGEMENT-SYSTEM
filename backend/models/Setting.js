
const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      default: "ABC Technologies",
      trim: true,
    },

    companyLogo: {
      type: String,
      default: "",
    },

    companyAddress: {
      type: String,
      default: "",
      trim: true,
    },

    contactEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    contactPhone: {
      type: String,
      default: "",
      trim: true,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    workingHours: {
      start: {
        type: String,
        default: "09:00",
      },
      end: {
        type: String,
        default: "18:00",
      },
    },

    visitorPassExpiryHours: {
      type: Number,
      default: 12,
      min: 1,
      max: 72,
    },

    requireApproval: {
      type: Boolean,
      default: true,
    },

    allowWalkInVisitors: {
      type: Boolean,
      default: true,
    },

    allowMultipleVisits: {
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

module.exports = mongoose.model("Setting", settingSchema);
