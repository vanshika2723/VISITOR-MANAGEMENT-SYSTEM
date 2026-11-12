
const Blacklist = require("../models/Blacklist");
const Visitor = require("../models/Visitor");
const logActivity = require("../utils/activityLogger");

// Normalize phone number
const normalizePhone = (phone) => {
  return String(phone || "").replace(/\D/g, "");
};

// ===============================
// ADD TO BLACKLIST
// ===============================
const addToBlacklist = async (req, res, next) => {
  try {
    const { name, phone, email, reason, notes } = req.body;

    if (!name || !phone || !reason) {
      return res.status(400).json({
        success: false,
        message: "Name, phone number and reason are required.",
      });
    }

    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number.",
      });
    }

    // Check existing active blacklist entry
  const alreadyBlocked = await Blacklist.exists({
  phone: normalizedPhone,
  status: "blocked",
});
    if (alreadyBlocked) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already blacklisted.",
      });
    }

    const blacklistEntry = await Blacklist.create({
      name: name.trim(),
      phone: normalizedPhone,
      email: email || "",
      reason: reason.trim(),
      notes: notes || "",
      status: "blocked",
      blockedBy: req.user._id,
    });

    // Update matching visitor records
    await Visitor.updateMany(
      { phone: normalizedPhone },
      { $set: { isBlacklisted: true } }
    );

    await logActivity({
      req,
      action: "VISITOR_BLACKLISTED",
      description: `${name} was added to the blacklist.`,
      metadata: {
        phone: normalizedPhone,
        reason: reason.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Visitor added to blacklist successfully.",
      blacklistEntry,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// GET ALL BLACKLIST ENTRIES
// ===============================
const getBlacklist = async (req, res, next) => {
  try {
    const { search, status = "blocked" } = req.query;

    const filter = {};

    if (["blocked", "unblocked"].includes(status)) {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { reason: searchRegex },
      ];
    }

    const entries = await Blacklist.find(filter)
      .populate("blockedBy", "name email")
      .populate("unblockedBy", "name email")
      .sort({ blockedAt: -1 });

    return res.status(200).json({
      success: true,
      count: entries.length,
      entries,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// UNBLOCK VISITOR
// ===============================
const unblockVisitor = async (req, res, next) => {
  try {
    const entry = await Blacklist.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Blacklist record not found.",
      });
    }

    if (entry.status === "unblocked") {
      return res.status(400).json({
        success: false,
        message: "This visitor is already unblocked.",
      });
    }

    entry.status = "unblocked";
    entry.unblockedBy = req.user._id;
    entry.unblockedAt = new Date();

    await entry.save();

    // Check whether another active blacklist entry exists
    const normalizedPhone = normalizePhone(entry.phone);

  const stillBlocked = await Blacklist.exists({
  phone: normalizedPhone,
  status: "blocked",
});

    if (!stillBlocked) {
      await Visitor.updateMany(
        { phone: normalizedPhone },
        { $set: { isBlacklisted: false } }
      );
    }

    await logActivity({
      req,
      action: "VISITOR_UNBLOCKED",
      description: `${entry.name} was removed from the active blacklist.`,
      metadata: {
        phone: normalizedPhone,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Visitor unblocked successfully.",
      entry,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToBlacklist,
  getBlacklist,
  unblockVisitor,
};
