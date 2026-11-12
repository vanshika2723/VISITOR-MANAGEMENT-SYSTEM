
const Visitor = require("../models/Visitor");
const logActivity = require("../utils/activityLogger");

// Escape CSV values and prevent spreadsheet formula injection
const escapeCSV = (value) => {
  let text = String(value ?? "");

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

// Build report filters
const buildReportFilter = (query) => {
  const filter = {};

  const { startDate, endDate, approvalStatus, visitStatus, host } = query;

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      const start = new Date(startDate);

      if (Number.isNaN(start.getTime())) {
        throw new Error("Invalid start date.");
      }

      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);

      if (Number.isNaN(end.getTime())) {
        throw new Error("Invalid end date.");
      }

      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }

    if (
      filter.createdAt.$gte &&
      filter.createdAt.$lte &&
      filter.createdAt.$gte > filter.createdAt.$lte
    ) {
      throw new Error("Start date cannot be after end date.");
    }
  }

  if (approvalStatus) {
    const allowed = ["pending", "approved", "rejected"];

    if (!allowed.includes(approvalStatus)) {
      throw new Error("Invalid approval status.");
    }

    filter.approvalStatus = approvalStatus;
  }

  if (visitStatus) {
    const allowed = [
      "registered",
      "checked-in",
      "checked-out",
      "cancelled",
    ];

    if (!allowed.includes(visitStatus)) {
      throw new Error("Invalid visit status.");
    }

    filter.visitStatus = visitStatus;
  }

  if (host) {
    filter.host = host;
  }

  return filter;
};

// ===============================
// GET VISITOR REPORT
// ===============================
const getVisitorReport = async (req, res, next) => {
  try {
    const filter = buildReportFilter(req.query);

    // Employees can only access their own visitor reports
    if (req.user.role === "employee") {
      filter.host = req.user._id;
    }

    const visitors = await Visitor.find(filter)
      .select("-passToken")
      .populate("host", "name email department")
      .populate("registeredBy", "name role")
      .populate("approvedBy", "name role")
      .sort({ createdAt: -1 })
      .limit(5000);

    const summary = {
      totalVisitors: visitors.length,
      pending: visitors.filter(
        (item) => item.approvalStatus === "pending"
      ).length,
      approved: visitors.filter(
        (item) => item.approvalStatus === "approved"
      ).length,
      rejected: visitors.filter(
        (item) => item.approvalStatus === "rejected"
      ).length,
      checkedIn: visitors.filter(
        (item) => item.visitStatus === "checked-in"
      ).length,
      checkedOut: visitors.filter(
        (item) => item.visitStatus === "checked-out"
      ).length,
    };

    return res.status(200).json({
      success: true,
      count: visitors.length,
      summary,
      visitors,
    });
  } catch (error) {
    if (
      error.message.startsWith("Invalid") ||
      error.message.startsWith("Start date")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

// ===============================
// EXPORT VISITOR REPORT AS CSV
// ===============================
const exportVisitorReport = async (req, res, next) => {
  try {
    const filter = buildReportFilter(req.query);

    if (req.user.role === "employee") {
      filter.host = req.user._id;
    }

    const visitors = await Visitor.find(filter)
      .select("-passToken")
      .populate("host", "name")
      .populate("registeredBy", "name")
      .sort({ createdAt: -1 })
      .limit(5000);

    const headers = [
      "Visitor ID",
      "Visitor Name",
      "Phone",
      "Email",
      "Company",
      "Purpose",
      "Host",
      "Appointment Date",
      "Approval Status",
      "Visit Status",
      "Check-in Time",
      "Check-out Time",
      "Registered By",
      "Created At",
    ];

    const rows = visitors.map((visitor) => [
      visitor.visitorId,
      visitor.name,
      visitor.phone,
      visitor.email,
      visitor.company,
      visitor.purpose,
      visitor.host?.name || "",
      visitor.appointmentDate?.toISOString() || "",
      visitor.approvalStatus,
      visitor.visitStatus,
      visitor.checkInTime?.toISOString() || "",
      visitor.checkOutTime?.toISOString() || "",
      visitor.registeredBy?.name || "",
      visitor.createdAt?.toISOString() || "",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    await logActivity({
      req,
      action: "REPORT_EXPORTED",
      description: "Visitor report exported as CSV.",
      metadata: {
        exportedRecords: visitors.length,
      },
    });

    const filename = `visitor-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    // UTF-8 BOM helps Excel display characters correctly
    return res.status(200).send("\uFEFF" + csvContent);
  } catch (error) {
    if (
      error.message.startsWith("Invalid") ||
      error.message.startsWith("Start date")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

module.exports = {
  getVisitorReport,
  exportVisitorReport,
};
