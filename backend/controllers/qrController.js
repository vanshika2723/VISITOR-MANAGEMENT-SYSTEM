
const Visitor = require("../models/Visitor");
const Blacklist = require("../models/Blacklist");
const Setting = require("../models/Setting");
const logActivity = require("../utils/activityLogger");

const normalizePhone = (phone) => {
  return String(phone || "").replace(/\D/g, "");
};

// VERIFY VISITOR QR PASS
const verifyVisitorPass = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Invalid QR pass token.",
      });
    }

    const visitor = await Visitor.findOne({ passToken: token })
      .select("+passToken")
      .populate("host", "name email department designation")
      .populate("registeredBy", "name role");

    if (!visitor) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: "Visitor pass not found or invalid.",
      });
    }

    // Check blacklist
    const activeBlacklist = await Blacklist.find({
      status: "blocked",
    }).select("phone");

    const isBlacklisted = activeBlacklist.some(
      (entry) =>
        normalizePhone(entry.phone) === normalizePhone(visitor.phone)
    );

    if (isBlacklisted || visitor.isBlacklisted) {
      return res.status(403).json({
        success: false,
        verified: false,
        message: "Visitor is blacklisted. Entry denied.",
      });
    }

    // Check approval
    if (visitor.approvalStatus !== "approved") {
      return res.status(403).json({
        success: false,
        verified: false,
        message: "Visitor approval is pending or rejected.",
      });
    }

    // Check visit status
    if (visitor.visitStatus === "checked-in") {
      return res.status(409).json({
        success: false,
        verified: false,
        message: "Visitor is already checked in.",
      });
    }

    if (
      visitor.visitStatus === "checked-out" ||
      visitor.visitStatus === "cancelled"
    ) {
      return res.status(403).json({
        success: false,
        verified: false,
        message: "This visitor pass is no longer valid for entry.",
      });
    }

    // Check pass expiry using company settings
    const settings = await Setting.findOne();

    const expiryHours = settings?.visitorPassExpiryHours || 12;

    const passExpiryTime =
      new Date(visitor.appointmentDate).getTime() +
      expiryHours * 60 * 60 * 1000;

    if (Date.now() > passExpiryTime) {
      return res.status(403).json({
        success: false,
        verified: false,
        message: "Visitor pass has expired. Please register a new visit.",
      });
    }

    // Record successful verification
    await logActivity({
      req,
      action: "VISITOR_VERIFIED",
      description: `${visitor.name}'s QR pass was verified.`,
      visitor: visitor._id,
      metadata: {
        visitorId: visitor.visitorId,
      },
    });

    return res.status(200).json({
      success: true,
      verified: true,
      message: "Visitor pass verified successfully.",
      visitor: {
        _id: visitor._id,
        visitorId: visitor.visitorId,
        name: visitor.name,
        phone: visitor.phone,
        email: visitor.email,
        company: visitor.company,
        purpose: visitor.purpose,
        photo: visitor.photo,
        host: visitor.host,
        appointmentDate: visitor.appointmentDate,
        approvalStatus: visitor.approvalStatus,
        visitStatus: visitor.visitStatus,
        checkInTime: visitor.checkInTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyVisitorPass,
};
