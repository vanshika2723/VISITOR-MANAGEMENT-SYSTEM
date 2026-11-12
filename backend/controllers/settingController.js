
const Setting = require("../models/Setting");

// Default settings
const defaultSettings = {
  companyName: "ABC Technologies",
  timezone: "Asia/Kolkata",
  workingHours: {
    start: "09:00",
    end: "18:00",
  },
};

// ===============================
// GET COMPANY SETTINGS
// ===============================
const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({
        ...defaultSettings,
        updatedBy: req.user._id,
      });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// UPDATE COMPANY SETTINGS
// ===============================
const updateSettings = async (req, res, next) => {
  try {
    const allowedFields = [
      "companyName",
      "companyLogo",
      "companyAddress",
      "contactEmail",
      "contactPhone",
      "timezone",
      "visitorPassExpiryHours",
      "requireApproval",
      "allowWalkInVisitors",
      "allowMultipleVisits",
    ];

    let settings = await Setting.findOne();

    if (!settings) {
      settings = new Setting({
        ...defaultSettings,
        updatedBy: req.user._id,
      });
    }

    // Update only permitted fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    }

    // Validate working hours
    if (req.body.workingHours !== undefined) {
      const { start, end } = req.body.workingHours;

      const validTime = (value) =>
        typeof value === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

      if (
        !validTime(start) ||
        !validTime(end) ||
        start >= end
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide valid working hours.",
        });
      }

      settings.workingHours = { start, end };
    }

    if (
      settings.visitorPassExpiryHours < 1 ||
      settings.visitorPassExpiryHours > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Pass expiry must be between 1 and 72 hours.",
      });
    }

    settings.updatedBy = req.user._id;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Company settings updated successfully.",
      settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
