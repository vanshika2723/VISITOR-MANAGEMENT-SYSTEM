
const Activity = require("../models/Activity");

// Reusable Activity Logger
const logActivity = async ({
  req,
  action,
  description,
  visitor = null,
  targetUser = null,
  metadata = {},
}) => {
  try {
    const user = req?.user || {};

    const activity = await Activity.create({
      action,
      description,

      performedBy: user._id || null,
      performedByName: user.name || "System",

      visitor: visitor?._id || visitor || null,
      targetUser: targetUser?._id || targetUser || null,

      ipAddress:
        req?.ip ||
        req?.headers?.["x-forwarded-for"] ||
        "",

      userAgent: req?.headers?.["user-agent"] || "",

      metadata,
    });

    return activity;
  } catch (error) {
    // Activity logging should not break the main operation.
    console.error("Activity Logging Failed:", error.message);

    return null;
  }
};

module.exports = logActivity;
