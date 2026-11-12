
const express = require("express");
const router = express.Router();

const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  cancelAppointment,
} = require("../controllers/appointmentController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// All appointment routes require login
router.use(protect);

// List appointments
router.get(
  "/",
  allowRoles("admin", "receptionist", "employee"),
  getAppointments
);

// Create appointment
router.post(
  "/",
  allowRoles("admin", "receptionist"),
  createAppointment
);

// Approve or reject appointment
router.patch(
  "/:id/status",
  allowRoles("admin", "employee"),
  updateAppointmentStatus
);

// Cancel appointment
router.patch(
  "/:id/cancel",
  allowRoles("admin", "receptionist", "employee"),
  cancelAppointment
);

// Update appointment
router.put(
  "/:id",
  allowRoles("admin", "receptionist", "employee"),
  updateAppointment
);

// Get appointment details
router.get(
  "/:id",
  allowRoles("admin", "receptionist", "employee"),
  getAppointmentById
);

module.exports = router;
