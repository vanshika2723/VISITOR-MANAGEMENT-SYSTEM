
const cron = require("node-cron");
const Visitor = require("../models/Visitor");
const sendEmail = require("./emailService");

const startAppointmentReminderService = () => {
  // Har 5 minute mein upcoming appointments check karo
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();

      // Agle 24 hours ke andar appointments
      const reminderWindow = new Date(
        now.getTime() + 24 * 60 * 60 * 1000
      );

      const visitors = await Visitor.find({
        appointmentDate: {
          $gt: now,
          $lte: reminderWindow,
        },
        email: { $exists: true, $ne: "" },
        appointmentReminderSent: false,
        approvalStatus: "approved",
        visitStatus: "registered",
      });

      for (const visitor of visitors) {
        try {
          await sendEmail({
            to: visitor.email,
            subject: `Appointment Reminder - ${visitor.visitorId}`,
            html: `
              <div style="font-family:Arial,sans-serif;padding:24px;color:#333">
                <h2 style="color:#e87524">VisitPro - Appointment Reminder</h2>
                <p>Hello ${visitor.name},</p>
                <p>This is a reminder for your upcoming visit.</p>
                <p><strong>Visitor ID:</strong> ${visitor.visitorId}</p>
                <p><strong>Purpose:</strong> ${visitor.purpose}</p>
                <p><strong>Appointment:</strong> ${new Date(
                  visitor.appointmentDate
                ).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}</p>
                <p>Please arrive on time and keep your visitor pass ready.</p>
                <p>Regards,<br/>VisitPro Team</p>
              </div>
            `,
          });

          visitor.appointmentReminderSent = true;
          await visitor.save();

          console.log(
            `Appointment reminder sent to ${visitor.email}`
          );
        } catch (emailError) {
          console.error(
            `Reminder failed for ${visitor.visitorId}:`,
            emailError.message
          );
        }
      }
    } catch (error) {
      console.error(
        "Appointment reminder scheduler error:",
        error.message
      );
    }
  });

  console.log("Appointment reminder scheduler started.");
};

module.exports = startAppointmentReminderService;
