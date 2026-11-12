
const EmailLog = require("../models/EmailLog");

// ===============================
// GET EMAIL LOGS
// ===============================
const getEmailLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 20)
    );

    const filter = {};

    // Filter by delivery status
    if (req.query.status) {
      const allowedStatuses = ["pending", "sent", "failed"];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email status.",
        });
      }

      filter.status = req.query.status;
    }

    // Filter by email type
    if (req.query.emailType) {
      const allowedTypes = [
        "visitor_registration",
        "appointment_confirmation",
        "approval",
        "rejection",
        "checkin",
        "checkout",
        "appointment_reminder",
        "password_reset",
        "system",
      ];

      if (!allowedTypes.includes(req.query.emailType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email type.",
        });
      }

      filter.emailType = req.query.emailType;
    }

   // Search recipient or subject
if (req.query.search) {
  const search = String(req.query.search)
    .trim()
    .slice(0, 100)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (search) {
    filter.$or = [
      { recipient: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
    ];
  }
}
// Filter by date range
const { startDate, endDate } = req.query;

if (startDate || endDate) {
  const dateFilter = {};

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`);

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date.",
      });
    }

    dateFilter.$gte = start;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999Z`);

    if (Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date.",
      });
    }

    dateFilter.$lte = end;
  }

  if (
    dateFilter.$gte &&
    dateFilter.$lte &&
    dateFilter.$gte > dateFilter.$lte
  ) {
    return res.status(400).json({
      success: false,
      message: "Start date cannot be after end date.",
    });
  }

  filter.createdAt = dateFilter;
}
    const [emailLogs, total, summary] = await Promise.all([
      EmailLog.find(filter)
        .select("-message")
        .populate("visitor", "name visitorId")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      EmailLog.countDocuments(filter),

      EmailLog.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusSummary = {
      pending: 0,
      sent: 0,
      failed: 0,
    };

    summary.forEach((item) => {
      statusSummary[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      count: emailLogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      summary: statusSummary,
      emailLogs,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// GET SINGLE EMAIL LOG
// ===============================
const getEmailLogById = async (req, res, next) => {
  try {
    const emailLog = await EmailLog.findById(req.params.id)
      .select("-message")
      .populate("visitor", "name visitorId");

    if (!emailLog) {
      return res.status(404).json({
        success: false,
        message: "Email log not found.",
      });
    }

    return res.status(200).json({
      success: true,
      emailLog,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmailLogs,
  getEmailLogById,
};
