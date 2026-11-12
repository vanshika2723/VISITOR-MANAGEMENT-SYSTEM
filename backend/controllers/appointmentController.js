
const Appointment = require("../models/Appointment");
const Visitor = require("../models/Visitor");
const User = require("../models/User");
const Notification = require("../models/Notification");
const logActivity = require("../utils/activityLogger");

// Check employee access to an appointment
const canAccessAppointment = (appointment, user) => {
  if (user.role === "admin" || user.role === "receptionist") {
    return true;
  }

  return (
    user.role === "employee" &&
    appointment.host._id.toString() === user._id.toString()
  );
};

// ===============================
// CREATE APPOINTMENT
// ===============================
const createAppointment = async (req, res, next) => {
  try {
    const {
      visitor,
      host,
      subject,
      purpose,
      appointmentDate,
      startTime,
      endTime,
      meetingLocation,
      notes,
    } = req.body;

    if (
      !visitor ||
      !host ||
      !subject ||
      !purpose ||
      !appointmentDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required appointment details.",
      });
    }

    const visitorRecord = await Visitor.findById(visitor);

    if (!visitorRecord) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found.",
      });
    }

    const hostUser = await User.findOne({
      _id: host,
      role: "employee",
      isActive: true,
    });

    if (!hostUser) {
      return res.status(400).json({
        success: false,
        message: "Selected host employee is invalid or inactive.",
      });
    }

    if (visitorRecord.host.toString() !== hostUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Appointment host must match the visitor's assigned host.",
      });
    }

    const date = new Date(appointmentDate);
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      Number.isNaN(date.getTime()) ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date or time.",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    const appointment = await Appointment.create({
      visitor: visitorRecord._id,
      host: hostUser._id,
      subject: subject.trim(),
      purpose: purpose.trim(),
      appointmentDate: date,
      startTime: start,
      endTime: end,
      meetingLocation: meetingLocation || "Main Office",
      notes: notes || "",
      status: "pending",
      createdBy: req.user._id,
    });

    await Notification.create({
      recipient: hostUser._id,
      title: "New Appointment Request",
      message: `An appointment has been scheduled for visitor ${visitorRecord.name}.`,
      type: "approval_request",
      visitor: visitorRecord._id,
      actionUrl: `/appointments/${appointment._id}`,
    });

    await logActivity({
      req,
      action: "OTHER",
      description: `Appointment ${appointment.appointmentId} was created.`,
      visitor: visitorRecord._id,
      metadata: {
        appointmentId: appointment.appointmentId,
        host: hostUser.name,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully.",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// GET ALL APPOINTMENTS
// ===============================
const getAppointments = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === "employee") {
      filter.host = req.user._id;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.date) {
      const date = new Date(req.query.date);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment date.",
        });
      }

      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.appointmentDate = {
        $gte: start,
        $lte: end,
      };
    }

    const appointments = await Appointment.find(filter)
      .populate("visitor", "name visitorId phone company")
      .populate("host", "name email department")
      .populate("createdBy", "name role")
      .sort({ appointmentDate: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// GET APPOINTMENT BY ID
// ===============================
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("visitor", "name visitorId phone email company purpose")
      .populate("host", "name email department designation")
      .populate("createdBy", "name role")
      .populate("approvedBy", "name role");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    if (!canAccessAppointment(appointment, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this appointment.",
      });
    }

    return res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// UPDATE APPOINTMENT
// ===============================
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    if (
      req.user.role === "employee" &&
      appointment.host.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this appointment.",
      });
    }

    if (["completed", "cancelled"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: "Completed or cancelled appointments cannot be updated.",
      });
    }

    const {
      subject,
      purpose,
      appointmentDate,
      startTime,
      endTime,
      meetingLocation,
      notes,
    } = req.body;

    const newStart = startTime
      ? new Date(startTime)
      : appointment.startTime;

    const newEnd = endTime
      ? new Date(endTime)
      : appointment.endTime;

    if (
      Number.isNaN(newStart.getTime()) ||
      Number.isNaN(newEnd.getTime()) ||
      newEnd <= newStart
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid appointment time range.",
      });
    }

    if (appointmentDate !== undefined) {
      const newDate = new Date(appointmentDate);

      if (Number.isNaN(newDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment date.",
        });
      }

      appointment.appointmentDate = newDate;
    }

    if (subject !== undefined) appointment.subject = subject.trim();
    if (purpose !== undefined) appointment.purpose = purpose.trim();
    if (startTime !== undefined) appointment.startTime = newStart;
    if (endTime !== undefined) appointment.endTime = newEnd;
    if (meetingLocation !== undefined) appointment.meetingLocation = meetingLocation;
    if (notes !== undefined) appointment.notes = notes;

    appointment.status = "rescheduled";

    await appointment.save();

    await logActivity({
      req,
      action: "OTHER",
      description: `Appointment ${appointment.appointmentId} was updated.`,
      visitor: appointment.visitor,
    });

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully.",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// APPROVE / REJECT APPOINTMENT
// ===============================
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected.",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    if (
      req.user.role === "employee" &&
      appointment.host.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot manage this appointment.",
      });
    }

    if (!["pending", "scheduled", "rescheduled"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: "This appointment cannot be approved or rejected now.",
      });
    }

    appointment.status = status;
    appointment.approvedBy = req.user._id;
    appointment.approvedAt = new Date();

    await appointment.save();

    const visitorRecord = await Visitor.findById(appointment.visitor);

    if (visitorRecord) {
      await Notification.create({
        recipient: visitorRecord.registeredBy,
        title: `Appointment ${status}`,
        message: `Appointment ${appointment.appointmentId} has been ${status}.`,
        type: status === "approved"
          ? "approval_approved"
          : "approval_rejected",
        visitor: visitorRecord._id,
      });
    }

    await logActivity({
      req,
      action: "OTHER",
      description: `Appointment ${appointment.appointmentId} was ${status}.`,
      visitor: appointment.visitor,
    });

    return res.status(200).json({
      success: true,
      message: `Appointment ${status} successfully.`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// CANCEL APPOINTMENT
// ===============================
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    if (
      req.user.role === "employee" &&
      appointment.host.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot cancel this appointment.",
      });
    }

    if (["completed", "cancelled"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: "This appointment is already completed or cancelled.",
      });
    }

    appointment.status = "cancelled";
    appointment.cancelledAt = new Date();

    await appointment.save();

    await logActivity({
      req,
      action: "OTHER",
      description: `Appointment ${appointment.appointmentId} was cancelled.`,
      visitor: appointment.visitor,
    });

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully.",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  cancelAppointment,
};
