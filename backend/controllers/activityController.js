
const Activity = require("../models/Activity");

// GET ALL ACTIVITY LOGS
const getActivityLogs = async (req, res, next) => {
  try {
    const {
      search = "",
      action = "",
      page = 1,
      limit = 20,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    if (action) {
      filter.action = action;
    }

    if (search.trim()) {
      filter.$or = [
        { description: { $regex: search.trim(), $options: "i" } },
        { performedByName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate("performedBy", "name email role")
        .populate("visitor", "visitorId name company")
        .populate("targetUser", "name email role")
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit)
        .lean(),

      Activity.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      activities,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
};
