
const Visitor = require("../models/Visitor");
const User = require("../models/User");
const Blacklist = require("../models/Blacklist");
const Notification = require("../models/Notification");
const QRCode = require("qrcode");
const createNotification = require("../utils/createNotification");
const notifyByRole = require("../utils/notifyByRole");
const Setting = require("../models/Setting");
const sendEmail = require("../services/emailService");
const { emitVisitorUpdate } = require("../utils/socket");
const {
  registrationEmail,
  approvalEmail,
  rejectionEmail,
} = require("../templates/emailTemplates");

const logActivity = require("../utils/activityLogger");

// Normalize phone number for consistent blacklist checking
const normalizePhone = (phone) => {
  return String(phone || "").replace(/\D/g, "");
};

// ===============================
// REGISTER VISITOR
// ===============================


const registerVisitor = async (req, res, next) => {
  try {
    const settings = await Setting.findOne();

const visitorSettings = {
  requireApproval: settings?.requireApproval ?? true,
  allowWalkInVisitors: settings?.allowWalkInVisitors ?? true,
  allowMultipleVisits: settings?.allowMultipleVisits ?? true,
};
    const {
      name,
      phone,
      email,
      company,
      purpose,
      host,
      appointmentDate,
      notes,
    } = req.body;

    // Validate required fields
 if (!name || !phone || !purpose || !host) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required visitor details.",
      });
    }
if (!appointmentDate && !visitorSettings.allowWalkInVisitors) {
  return res.status(400).json({
    success: false,
    message: "Walk-in visitors are not allowed.",
  });
}
    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number.",
      });
    }
// Check repeat visitor restriction
if (!visitorSettings.allowMultipleVisits) {
  const existingVisitor = await Visitor.findOne({
    phone: normalizedPhone,
    visitStatus: { $ne: "cancelled" },
  });

  if (existingVisitor) {
    return res.status(409).json({
      success: false,
      message: "Multiple visits are not allowed for this visitor.",
    });
  }
}
 let visitDate = null;

if (appointmentDate) {
  visitDate = new Date(appointmentDate);

  if (Number.isNaN(visitDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid appointment date.",
    });
  }
}
 // Check blacklist directly in MongoDB
const isBlacklisted = await Blacklist.exists({
  phone: normalizedPhone,
  status: "blocked",
});

    if (isBlacklisted) {
      return res.status(403).json({
        success: false,
        message: "This visitor is blacklisted. Registration denied.",
        blocked: true,
      });
    }

    // Validate host
    const hostUser = await User.findOne({
      _id: host,
      role: "employee",
      isActive: true,
    });

    if (!hostUser) {
      return res.status(400).json({
        success: false,
        message: "Selected host employee does not exist or is inactive.",
      });
    }

    // Create visitor
    const visitor = await Visitor.create({
      name: name.trim(),
      phone: normalizedPhone,
      email: email || "",
      company: company || "",
      purpose: purpose.trim(),
      host: hostUser._id,
      appointmentDate: visitDate,
      notes: notes || "",
      photo: req.file ? `/uploads/${req.file.filename}` : "",
      registeredBy: req.user._id,
 approvalStatus: visitorSettings.requireApproval ? "pending" : "approved",
approvedBy: visitorSettings.requireApproval ? null : req.user._id,
approvedAt: visitorSettings.requireApproval ? null : new Date(),
      visitStatus: "registered",
      idType: req.body.idType || "none",
idNumber: req.body.idNumber || "",
    });

    // Generate QR code using private pass token
    const qrCode = await QRCode.toDataURL(visitor.passToken);


    // Notify host employee
    await createNotification({
      recipient: hostUser._id,
      title: "New Visitor Registration",
      message: `${visitor.name} has registered to visit you.`,
      type: "approval_request",
      visitor: visitor._id,
      actionUrl: `/visitors/${visitor._id}`,
    });

    // Notify active admins and receptionists
    await notifyByRole({
      roles: ["admin", "receptionist"],
      title: "New Visitor Registered",
      message: `${visitor.name} registered for ${hostUser.name}. Approval is pending.`,
      type: "visitor_registration",
      visitor: visitor._id,
      actionUrl: `/visitors/${visitor._id}`,
      excludeUserId: req.user._id,
    });

// ===============================
// REAL-TIME DASHBOARD UPDATE
// ===============================
emitVisitorUpdate({
  action: "visitor_registered",
  visitorId: visitor._id,
  visitorName: visitor.name,
  timestamp: new Date(),
});
    // Activity log
    await logActivity({
      req,
      action: "VISITOR_REGISTERED",
      description: `${visitor.name} was registered successfully.`,
      visitor: visitor._id,
      metadata: {
        visitorId: visitor.visitorId,
        host: hostUser.name,
      },
    });

    // Send ONE registration email
    if (visitor.email) {
      try {
        await sendEmail({
          to: visitor.email,
          subject: `Visitor Registration Received - ${visitor.visitorId}`,
          html: registrationEmail(visitor),
        });

        console.log("Registration email sent successfully!");
      } catch (emailError) {
        console.error(
          "Registration email failed:",
          emailError.message
        );
      }
   
    // Send registration email in background
    if (visitor.email) {
      sendEmail({
        to: visitor.email,
        subject: `Visitor Registration Received - ${visitor.visitorId}`,
        html: registrationEmail(visitor),
      })
        .then(() => {
          console.log("Registration email sent successfully!");
        })
        .catch((emailError) => {
          console.error(
            "Registration email failed:",
            emailError.message
          );
        });
    }

    // Return response immediately
    return res.status(201).json({
      success: true,
      message: "Visitor registered successfully.",
      visitor: {
        ...visitor.toObject(),
        passToken: visitor.passToken,
        qrCode,
      },
    });

   

  } catch (error) {
    next(error);
  }
};


// ===============================
// GET ALL VISITORS
// ===============================
const getVisitors = async (req, res, next) => {
  try {
    const {
      search,
      approvalStatus,
      visitStatus,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
    }

    if (visitStatus) {
      filter.visitStatus = visitStatus;
    }

    // Employees can only see their own visitors
    if (req.user.role === "employee") {
      filter.host = req.user._id;
    }

    if (search) {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { visitorId: searchRegex },
      ];
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 10));

    const total = await Visitor.countDocuments(filter);

    const visitors = await Visitor.find(filter)
      .populate("host", "name email department")
      .populate("registeredBy", "name role")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    return res.status(200).json({
      success: true,
      count: visitors.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageLimit),
      visitors,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// GET SINGLE VISITOR
// ===============================
const getVisitorById = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate("host", "name email department")
      .populate("registeredBy", "name role");

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found.",
      });
    }

    if (
      req.user.role === "employee" &&
      !visitor.host._id.equals(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this visitor.",
      });
    }

    return res.status(200).json({
      success: true,
      visitor,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// UPDATE VISITOR
// ===============================
const updateVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found.",
      });
    }

    const {
      name,
      phone,
      email,
      company,
      purpose,
      host,
      appointmentDate,
      notes,
    } = req.body;

    if (phone !== undefined) {
      const normalizedPhone = normalizePhone(phone);

      if (
        normalizedPhone.length < 10 ||
        normalizedPhone.length > 15
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number.",
        });
      }

      const blockedVisitors = await Blacklist.find({
        status: "blocked",
      }).select("phone");

      const isBlacklisted = blockedVisitors.some(
        (item) =>
          normalizePhone(item.phone) === normalizedPhone
      );

      if (isBlacklisted) {
        return res.status(403).json({
          success: false,
          message: "This phone number is blacklisted.",
        });
      }

      visitor.phone = normalizedPhone;
    }

    if (host !== undefined) {
      const hostUser = await User.findOne({
        _id: host,
        role: "employee",
        isActive: true,
      });

      if (!hostUser) {
        return res.status(400).json({
          success: false,
          message: "Selected host employee is invalid.",
        });
      }

      visitor.host = hostUser._id;
    }

    if (appointmentDate !== undefined) {
      const date = new Date(appointmentDate);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment date.",
        });
      }

      visitor.appointmentDate = date;
    }

    if (name !== undefined) visitor.name = name;
    if (email !== undefined) visitor.email = email;
    if (company !== undefined) visitor.company = company;
    if (purpose !== undefined) visitor.purpose = purpose;
    if (notes !== undefined) visitor.notes = notes;

    if (req.file) {
      visitor.photo = `/uploads/${req.file.filename}`;
    }

    await visitor.save();

    await logActivity({
      req,
      action: "VISITOR_UPDATED",
      description: `${visitor.name}'s details were updated.`,
      visitor: visitor._id,
    });

    return res.status(200).json({
      success: true,
      message: "Visitor updated successfully.",
      visitor,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// DELETE VISITOR
// ===============================
const deleteVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found.",
      });
    }

    if (visitor.visitStatus === "checked-in") {
      return res.status(400).json({
        success: false,
        message: "A checked-in visitor cannot be deleted.",
      });
    }

    await Visitor.findByIdAndDelete(visitor._id);

    await logActivity({
      req,
      action: "VISITOR_DELETED",
      description: `${visitor.name}'s visitor record was deleted.`,
      visitor: visitor._id,
      metadata: {
        visitorId: visitor.visitorId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Visitor deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const verifyVisitorId = async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findById(id).select("+idNumber");

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found.",
      });
    }

    if (!visitor.idType || visitor.idType === "none" || !visitor.idNumber) {
      return res.status(400).json({
        success: false,
        message: "Visitor ID type and ID number are required.",
      });
    }

    visitor.idVerified = true;
    visitor.idVerifiedBy = req.user._id;
    visitor.idVerifiedAt = new Date();

    await visitor.save();

    return res.status(200).json({
      success: true,
      message: "Visitor ID marked as physically verified.",
      visitor: {
        _id: visitor._id,
        visitorId: visitor.visitorId,
        name: visitor.name,
        idType: visitor.idType,
        idVerified: visitor.idVerified,
        idVerifiedBy: visitor.idVerifiedBy,
        idVerifiedAt: visitor.idVerifiedAt,
      },
    });
  } catch (error) {
    console.error("Verify visitor ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify visitor ID.",
    });
  }
};

module.exports = {
  registerVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
  deleteVisitor,
  verifyVisitorId,
};