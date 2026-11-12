const User = require("../models/User");
const Visitor = require("../models/Visitor");
const Blacklist = require("../models/Blacklist");
const Setting = require("../models/Setting");
const Notification = require("../models/Notification");
const logActivity = require("../utils/activityLogger");
const sendEmail = require("../services/emailService");
const QRCode = require("qrcode");
const createNotification = require("../utils/createNotification");
const { emitVisitorUpdate } = require("../utils/socket");
const {
  approvalEmail,
  rejectionEmail,
} = require("../templates/emailTemplates");

const normalizePhone = (phone) =>
  String(phone || "").replace(/\D/g, "");

const canManageApproval = (visitor, user) => {
  if (user.role === "admin") return true;

  return (
    user.role === "employee" &&
    visitor.host &&
    visitor.host.toString() === user._id.toString()
  );
};



// APPROVE VISITOR


const approveVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .select("+passToken");

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found.",
      });
    }

    if (!canManageApproval(visitor, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to approve this visitor.",
      });
    }

    if (visitor.approvalStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending visitors can be approved.",
      });
    }

    // STEP 1: Update approval in database
    visitor.approvalStatus = "approved";
    visitor.approvedBy = req.user._id;
    visitor.approvedAt = new Date();
    visitor.rejectionReason = "";

    await visitor.save();

    console.log("Visitor approved successfully:", visitor.visitorId);

    // STEP 2: Notification in background
    Promise.resolve()
      .then(() =>
        createNotification({
          recipient: visitor.registeredBy,
          title: "Visitor Approved",
          message: `${visitor.name}'s visit has been approved.`,
          type: "approval_approved",
          visitor: visitor._id,
          actionUrl: `/visitors/${visitor._id}`,
        })
      )
      .catch((error) => {
        console.error("Approval notification failed:", error.message);
      });

    // STEP 3: Activity log in background
    Promise.resolve()
      .then(() =>
        logActivity({
          req,
          action: "VISITOR_APPROVED",
          description: `${visitor.name}'s visit was approved.`,
          visitor: visitor._id,
        })
      )
      .catch((error) => {
        console.error("Approval activity log failed:", error.message);
      });

    // STEP 4: Approval email and QR in background
    if (visitor.email) {
      Promise.resolve()
        .then(async () => {
          const qrBuffer = await QRCode.toBuffer(
            visitor.passToken,
            {
              type: "png",
              width: 300,
              margin: 2,
            }
          );

          const qrSection = `
            <div style="text-align:center;padding:20px;">
              <h3>Your Digital Visitor Pass</h3>
              <p>Show this QR code at reception.</p>
              <img
                src="cid:visitor-qr"
                alt="Visitor QR Pass"
                width="220"
                height="220"
              />
              <p><strong>${visitor.visitorId}</strong></p>
            </div>
          `;

          const html = approvalEmail(visitor).replace(
            "</body>",
            `${qrSection}</body>`
          );

          await sendEmail({
            to: visitor.email,
            subject: `Visit Approved - ${visitor.visitorId}`,
            html,
            attachments: [
              {
                filename: `VisitPro-${visitor.visitorId}.png`,
                content: qrBuffer,
                contentType: "image/png",
                cid: "visitor-qr",
              },
            ],
          });

          console.log("Approval email with QR pass sent!");
        })
        .catch((error) => {
          console.error("Approval QR email failed:", error.message);
        });
    }

    // STEP 5: Return success immediately
    return res.status(200).json({
      success: true,
      message: "Visitor approved successfully.",
      visitor,
    });

  } catch (error) {
    console.error("Approve visitor error:", error);
    next(error);
  }
};


// REJECT VISITOR
const rejectVisitor = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    if (
      !rejectionReason ||
      !rejectionReason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason.",
      });
    }

    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found.",
      });
    }

    if (!canManageApproval(visitor, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this visitor.",
      });
    }

    if (visitor.approvalStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending visitors can be rejected.",
      });
    }

    visitor.approvalStatus = "rejected";
    visitor.approvedBy = req.user._id;
    visitor.approvedAt = new Date();
    visitor.rejectionReason = rejectionReason.trim();

    await visitor.save();

   
    await createNotification({
      recipient: visitor.registeredBy,
      title: "Visitor Request Rejected",
      message: `${visitor.name}'s visit was rejected. Reason: ${visitor.rejectionReason}`,
      type: "approval_rejected",
      visitor: visitor._id,
      actionUrl: `/visitors/${visitor._id}`,
    });


    await logActivity({
      req,
      action: "VISITOR_REJECTED",
      description: `${visitor.name}'s visit was rejected.`,
      visitor: visitor._id,
      metadata: {
        rejectionReason: visitor.rejectionReason,
      },
    });

    // SEND REJECTION EMAIL
    if (visitor.email) {
      try {
        await sendEmail({
          to: visitor.email,
          subject: `Visit Request Rejected - ${visitor.visitorId}`,
          html: rejectionEmail(visitor),
        });

        console.log("Visitor rejection email sent!");
      } catch (emailError) {
        console.error(
          "Rejection email failed:",
          emailError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Visitor rejected successfully.",
      visitor,
    });

  } catch (error) {
    next(error);
  }
};

// ATOMIC CHECK-IN VISITOR

const checkInVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found.",
      });
    }

    if (visitor.approvalStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Visitor must be approved before check-in.",
      });
    }

    // Check blacklist
    const blockedEntries = await Blacklist.find({
      status: "blocked",
    }).select("phone");

    const isBlacklisted = blockedEntries.some(
      (entry) =>
        normalizePhone(entry.phone) === normalizePhone(visitor.phone)
    );

    if (isBlacklisted || visitor.isBlacklisted) {
      return res.status(403).json({
        success: false,
        message: "Visitor is blacklisted. Check-in denied.",
      });
    }

    // Check appointment pass expiry
    const settings = await Setting.findOne();
    const expiryHours = settings?.visitorPassExpiryHours ?? 12;

    if (visitor.appointmentDate) {
      const expiryTime =
        new Date(visitor.appointmentDate).getTime() +
        expiryHours * 60 * 60 * 1000;

      if (Date.now() > expiryTime) {
        return res.status(403).json({
          success: false,
          message: "Visitor pass has expired. Please register a new visit.",
        });
      }
    }

    // Atomic update
    const updatedVisitor = await Visitor.findOneAndUpdate(
      {
        _id: visitor._id,
        approvalStatus: "approved",
        visitStatus: "registered",
        isBlacklisted: { $ne: true },
      },
      {
        $set: {
          visitStatus: "checked-in",
          checkInTime: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedVisitor) {
      const latestVisitor = await Visitor.findById(visitor._id);

      if (latestVisitor?.visitStatus === "checked-in") {
        return res.status(409).json({
          success: false,
          message: "Visitor is already checked in.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Visitor status changed. Please refresh and try again.",
      });
    }

    console.log("Visitor checked in:", updatedVisitor.visitorId);

    // Host notification in background
    Promise.resolve()
      .then(() =>
        createNotification({
          recipient: updatedVisitor.host,
          title: "Visitor Checked In",
          message: `${updatedVisitor.name} has arrived at the office.`,
          type: "visitor_checkin",
          visitor: updatedVisitor._id,
          actionUrl: `/visitors/${updatedVisitor._id}`,
        })
      )
      .catch((error) => {
        console.error("Check-in notification failed:", error.message);
      });

    // Host arrival email in background
    Promise.resolve()
      .then(async () => {
        const host = await User.findById(updatedVisitor.host)
          .select("name email");

        if (!host?.email) return;

        const checkInTime = new Date(
          updatedVisitor.checkInTime
        ).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        });

        await sendEmail({
          to: host.email,
          subject: `Visitor Arrived - ${updatedVisitor.visitorId}`,
          text: `
Hello ${host.name},

Your visitor has arrived at the office.

Visitor Name: ${updatedVisitor.name}
Visitor ID: ${updatedVisitor.visitorId}
Company: ${updatedVisitor.company || "N/A"}
Purpose: ${updatedVisitor.purpose}
Check-in Time: ${checkInTime}

Regards,
VisitPro Team
          `,
          html: `
            <div style="font-family:Arial,sans-serif;padding:24px;color:#333">
              <h2 style="color:#f47721">VisitPro - Visitor Arrival</h2>
              <p>Hello ${host.name},</p>
              <p>Your visitor has arrived at the office.</p>
              <p><strong>Visitor Name:</strong> ${updatedVisitor.name}</p>
              <p><strong>Visitor ID:</strong> ${updatedVisitor.visitorId}</p>
              <p><strong>Company:</strong> ${updatedVisitor.company || "N/A"}</p>
              <p><strong>Purpose:</strong> ${updatedVisitor.purpose}</p>
              <p><strong>Check-in Time:</strong> ${checkInTime}</p>
              <p>Regards,<br/>VisitPro Team</p>
            </div>
          `,
        });

        console.log("Host arrival email sent.");
      })
      .catch((error) => {
        console.error("Host arrival email failed:", error.message);
      });

    // Visitor check-in email in background
    if (updatedVisitor.email) {
      Promise.resolve()
        .then(() =>
          sendEmail({
            to: updatedVisitor.email,
            subject: `Check-in Confirmed - ${updatedVisitor.visitorId}`,
            html: `
              <div style="font-family:Arial,sans-serif;padding:24px;color:#333">
                <h2 style="color:#e87524">VisitPro - Check-in Confirmed</h2>
                <p>Hello ${updatedVisitor.name},</p>
                <p>Your check-in has been recorded successfully.</p>
                <p><strong>Visitor ID:</strong> ${updatedVisitor.visitorId}</p>
                <p><strong>Check-in time:</strong> ${new Date(
                  updatedVisitor.checkInTime
                ).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}</p>
                <p>Regards,<br/>VisitPro Team</p>
              </div>
            `,
          })
        )
        .then(() => console.log("Visitor check-in email sent."))
        .catch((error) => {
          console.error("Visitor check-in email failed:", error.message);
        });
    }

    // Real-time dashboard update
    try {
      emitVisitorUpdate({
        action: "visitor_checked_in",
        visitorId: updatedVisitor._id,
        visitorName: updatedVisitor.name,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Check-in socket update failed:", error.message);
    }

    // Activity logging in background
    Promise.resolve()
      .then(() =>
        logActivity({
          req,
          action: "VISITOR_CHECKED_IN",
          description: `${updatedVisitor.name} checked in.`,
          visitor: updatedVisitor._id,
        })
      )
      .catch((error) => {
        console.error("Check-in activity log failed:", error.message);
      });

    // Return success immediately
    return res.status(200).json({
      success: true,
      message: "Visitor checked in successfully.",
      visitor: updatedVisitor,
    });

  } catch (error) {
    console.error("Check-in error:", error);
    next(error);
  }
};

// CHECK-OUT VISITOR

const checkOutVisitor = async (req, res, next) => {
  try {
    // STEP 1: Update visitor status atomically
    const updatedVisitor = await Visitor.findOneAndUpdate(
      {
        _id: req.params.id,
        visitStatus: "checked-in",
      },
      {
        $set: {
          visitStatus: "checked-out",
          checkOutTime: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedVisitor) {
      const visitor = await Visitor.findById(req.params.id);

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: "Visitor not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Only checked-in visitors can be checked out.",
      });
    }

    console.log("Visitor checked out:", updatedVisitor.visitorId);

    // STEP 2: Notification in background
    Promise.resolve()
      .then(() =>
        createNotification({
          recipient: updatedVisitor.host,
          title: "Visitor Checked Out",
          message: `${updatedVisitor.name} has left the office.`,
          type: "visitor_checkout",
          visitor: updatedVisitor._id,
          actionUrl: `/visitors/${updatedVisitor._id}`,
        })
      )
      .catch((error) => {
        console.error("Checkout notification failed:", error.message);
      });

    // STEP 3: Real-time dashboard update
    try {
      emitVisitorUpdate({
        action: "visitor_checked_out",
        visitorId: updatedVisitor._id,
        visitorName: updatedVisitor.name,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Checkout socket update failed:", error.message);
    }

    // STEP 4: Activity log in background
    Promise.resolve()
      .then(() =>
        logActivity({
          req,
          action: "VISITOR_CHECKED_OUT",
          description: `${updatedVisitor.name} checked out.`,
          visitor: updatedVisitor._id,
        })
      )
      .catch((error) => {
        console.error("Checkout activity log failed:", error.message);
      });

    // STEP 5: Visitor email in background
    if (updatedVisitor.email) {
      Promise.resolve()
        .then(() =>
          sendEmail({
            to: updatedVisitor.email,
            subject: `Check-out Confirmed - ${updatedVisitor.visitorId}`,
            html: `
              <div style="font-family:Arial,sans-serif;padding:24px;color:#333">
                <h2 style="color:#e87524">VisitPro - Check-out Confirmed</h2>
                <p>Hello ${updatedVisitor.name},</p>
                <p>Your check-out has been recorded successfully.</p>
                <p><strong>Visitor ID:</strong> ${updatedVisitor.visitorId}</p>
                <p><strong>Check-out time:</strong> ${new Date(
                  updatedVisitor.checkOutTime
                ).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}</p>
                <p>Thank you for visiting us!</p>
                <p>Regards,<br/>VisitPro Team</p>
              </div>
            `,
          })
        )
        .then(() => console.log("Visitor check-out email sent!"))
        .catch((error) => {
          console.error("Check-out email failed:", error.message);
        });
    }

    // STEP 6: Return success immediately
    return res.status(200).json({
      success: true,
      message: "Visitor checked out successfully.",
      visitor: updatedVisitor,
    });

  } catch (error) {
    console.error("Check-out error:", error);
    next(error);
  }
};


module.exports = {
  approveVisitor,
  rejectVisitor,
  checkInVisitor,
  checkOutVisitor,
};
