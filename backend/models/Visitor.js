
const mongoose = require("mongoose");
const crypto = require("crypto");

const visitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Visitor name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
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

    company: {
      type: String,
      trim: true,
      default: "",
    },

    purpose: {
      type: String,
      required: [true, "Visit purpose is required"],
      trim: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host employee is required"],
    },

    photo: {
      type: String,
      default: "",
    },

    idType: {
      type: String,
      enum: ["none", "passport", "driving_license", "voter_id", "other"],
      default: "none",
    },

    idNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
      select: false,
    },

    idVerified: {
      type: Boolean,
      default: false,
    },

    idVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    idVerifiedAt: {
      type: Date,
      default: null,
    },
appointmentDate: {
  type: Date,
  default: null,
},
appointmentReminderSent: {
  type: Boolean,
  default: false,
},
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
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

    rejectionReason: {
      type: String,
      default: "",
    },

    visitStatus: {
      type: String,
      enum: ["registered", "checked-in", "checked-out", "cancelled"],
      default: "registered",
    },

    checkInTime: {
      type: Date,
      default: null,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    passToken: {
      type: String,
      unique: true,
      sparse: true,
      default: () => crypto.randomBytes(32).toString("hex"),
      select: false,
    },

    isBlacklisted: {
      type: Boolean,
      default: false,
    },

    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique visitor ID
visitorSchema.pre("validate", function () {
  if (!this.visitorId) {
    this.visitorId =
      "VIS-" +
      Date.now().toString() +
      "-" +
      crypto.randomBytes(2).toString("hex").toUpperCase();
  }
});

// Database Indexes
visitorSchema.index({ name: 1 });
visitorSchema.index({ phone: 1 });
visitorSchema.index({ appointmentDate: -1 });
visitorSchema.index({ host: 1, approvalStatus: 1 });
visitorSchema.index({ visitStatus: 1 });

module.exports = mongoose.model("Visitor", visitorSchema);
