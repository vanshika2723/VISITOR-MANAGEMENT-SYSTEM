
const Visitor = require("../models/Visitor");

// GET /api/analytics/summary
// Calculates analytics from the complete Visitor collection.
const getAnalyticsSummary = async (req, res) => {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );

    const [
      totalVisitors,
      registeredToday,
      currentlyCheckedIn,
      pendingApprovals,
      approvedVisitors,
      rejectedVisitors,
      checkedOutVisitors,
      monthlyResults,
      approvalResults,
      visitStatusResults,
    ] = await Promise.all([
      // All visitor records, without pagination
      Visitor.countDocuments(),

      Visitor.countDocuments({
        createdAt: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
      }),

      Visitor.countDocuments({
        visitStatus: "checked-in",
      }),

      Visitor.countDocuments({
        approvalStatus: "pending",
      }),

      Visitor.countDocuments({
        approvalStatus: "approved",
      }),

      Visitor.countDocuments({
        approvalStatus: "rejected",
      }),

      Visitor.countDocuments({
        visitStatus: "checked-out",
      }),

      // Monthly registrations for the current and previous five months
      Visitor.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo, $lt: startOfTomorrow },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            visitors: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      // Approval distribution across all records
      Visitor.aggregate([
        {
          $group: {
            _id: {
              $ifNull: ["$approvalStatus", "pending"],
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Visit-status distribution across all records
      Visitor.aggregate([
        {
          $group: {
            _id: {
              $ifNull: ["$visitStatus", "not started"],
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Include months with zero visitors too
    const monthlyVisitors = Array.from(
      { length: 6 },
      (_, index) => {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - 5 + index,
          1
        );

        const year = date.getFullYear();
        const monthNumber = date.getMonth() + 1;

        const result = monthlyResults.find(
          (item) =>
            item._id.year === year &&
            item._id.month === monthNumber
        );

        return {
          year,
          monthNumber,
          month: date.toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
          }),
          visitors: result ? result.visitors : 0,
        };
      }
    );

    const approvalDistribution = approvalResults.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    const visitStatusDistribution = visitStatusResults.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalVisitors,
          registeredToday,
          currentlyCheckedIn,
          pendingApprovals,
          approvedVisitors,
          rejectedVisitors,
          checkedOutVisitors,
        },
        monthlyVisitors,
        approvalDistribution,
        visitStatusDistribution,
      },
    });
  } catch (error) {
    console.error("Analytics summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate visitor analytics.",
    });
  }
};

module.exports = {
  getAnalyticsSummary,
};
