
const express = require("express");
const router = express.Router();

const Visitor = require("../models/Visitor");

const {
  registerVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
  deleteVisitor,
  verifyVisitorId,
} = require("../controllers/visitorController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// All visitor routes require login
router.use(protect);

// Get visitor list
router.get("/", getVisitors);

// Register visitor
router.post(
  "/",
  allowRoles("admin", "receptionist"),
  upload.single("photo"),
  registerVisitor
);

// Generate approved visitor pass
router.get(
  "/:id/pass",
  allowRoles("admin", "receptionist"),
  async (req, res, next) => {
    try {
      const visitor = await Visitor.findById(req.params.id)
        .select("+passToken")
        .populate("host", "name email department");

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: "Visitor not found.",
        });
      }

      if (visitor.approvalStatus !== "approved") {
        return res.status(403).json({
          success: false,
          message: "Visitor must be approved before generating a pass.",
        });
      }

      if (
        visitor.isBlacklisted ||
        ["rejected", "cancelled"].includes(visitor.visitStatus)
      ) {
        return res.status(403).json({
          success: false,
          message: "Visitor is not eligible for a pass.",
        });
      }

      if (!visitor.passToken) {
        return res.status(404).json({
          success: false,
          message: "Visitor QR token is unavailable.",
        });
      }

      return res.status(200).json({
        success: true,
        visitor: {
          _id: visitor._id,
          visitorId: visitor.visitorId,
          name: visitor.name,
          company: visitor.company,
          purpose: visitor.purpose,
          host: visitor.host,
          appointmentDate: visitor.appointmentDate,
          approvalStatus: visitor.approvalStatus,
          passToken: visitor.passToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
// Verify visitor's physical ID document
router.patch(
  "/:id/verify-id",
  allowRoles("admin", "receptionist"),
  verifyVisitorId
);
// Get visitor details
router.get("/:id", getVisitorById);

// Update visitor
router.put(
  "/:id",
  allowRoles("admin", "receptionist"),
  upload.single("photo"),
  updateVisitor
);

// Delete visitor
router.delete(
  "/:id",
  allowRoles("admin"),
  deleteVisitor
);

module.exports = router;
