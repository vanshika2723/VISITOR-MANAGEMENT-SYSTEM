
const nodemailer = require("nodemailer");
const EmailLog = require("../models/EmailLog");

let transporter = null;

// Create SMTP transporter
const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("SMTP configuration is missing.");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  return transporter;
};

// ===============================
// SEND EMAIL
// ===============================
const sendEmail = async ({
  to,
  subject,
  text,
  html,
  emailType = "system",
  visitor = null,
}) => {
  let emailLog = null;

  try {
    if (!to || !subject) {
      throw new Error("Recipient and subject are required.");
    }

    // Create email log
    emailLog = await EmailLog.create({
      recipient: to,
      subject,
      message: text || "",
      emailType,
      status: "pending",
      visitor,
      attempts: 1,
    });

    const mailTransporter = getTransporter();

    const info = await mailTransporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || "Visitor Management System",
        address: process.env.SMTP_USER,
      },
      to,
      subject,
      text: text || "",
      html: html || undefined,
    });

    emailLog.status = "sent";
    emailLog.sentAt = new Date();
    emailLog.errorMessage = "";

    await emailLog.save();

    return {
      success: true,
      message: "Email sent successfully.",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email Sending Failed:", error.message);

    // Save failed delivery details when a log exists
    if (emailLog) {
      try {
        emailLog.status = "failed";
        emailLog.errorMessage = error.message;
        await emailLog.save();
      } catch (logError) {
        console.error("Email Log Update Failed:", logError.message);
      }
    }

    return {
      success: false,
      message: "Email could not be sent.",
    };
  }
};

module.exports = {
  sendEmail,
};
