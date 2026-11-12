
const Visitor = require("../models/Visitor");
const User = require("../models/User");
const Activity = require("../models/Activity");

// ===============================
// GET DASHBOARD STATISTICS
// ===============================
const getDashboardStats = async (req, res, next) => {
  try {
    const userFilter =
      req.user.role === "employee"
        ? { host: req.user._id }
        : {};

    // Today's date boundaries
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Current month start
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    // Parallel database queries
    const [
      totalVisitors,
      todayVisitors,
      checkedInVisitors,
      checkedOutVisitors,
      pendingApprovals,
      approvedVisitors,
      rejectedVisitors,
      totalUsers,
      recentVisitors,
      monthlyVisitors,
      recentActivities,
    ] = await Promise.all([
      Visitor.countDocuments({
        ...userFilter,
        visitStatus: { $ne: "cancelled" },
      }),

      Visitor.countDocuments({
        ...userFilter,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }),

      Visitor.countDocuments({
        ...userFilter,
        visitStatus: "checked-in",
      }),

      Visitor.countDocuments({
        ...userFilter,
        visitStatus: "checked-out",
      }),

      Visitor.countDocuments({
        ...userFilter,
        approvalStatus: "pending",
      }),

      Visitor.countDocuments({
        ...userFilter,
        approvalStatus: "approved",
      }),

      Visitor.countDocuments({
        ...userFilter,
        approvalStatus: "rejected",
      }),

      req.user.role === "admin"
        ? User.countDocuments({ isActive: true })
        : Promise.resolve(null),

      Visitor.find(userFilter)
        .populate("host", "name department")
        .sort({ createdAt: -1 })
        .limit(5),

      Visitor.aggregate([
        {
          $match: {
            ...userFilter,
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: {
              $dayOfMonth: "$createdAt",
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),

      Activity.find(
        req.user.role === "employee"
          ? { visitor: { $in: await Visitor.find(userFilter).distinct("_id") } }
          : {}
      )
        .populate("performedBy", "name role")
        .populate("visitor", "name visitorId")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Format monthly chart data
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

    const monthlyStats = Array.from(
      { length: daysInMonth },
      (_, index) => {
        const day = index + 1;

        const record = monthlyVisitors.find(
          (item) => item._id === day
        );

        return {
          day,
          visitors: record ? record.count : 0,
        };
      }
    );

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully.",

      stats: {
        totalVisitors,
        todayVisitors,
        checkedInVisitors,
        checkedOutVisitors,
        pendingApprovals,
        approvedVisitors,
        rejectedVisitors,
        totalUsers,
      },

      monthlyStats,
      recentVisitors,
      recentActivities,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
