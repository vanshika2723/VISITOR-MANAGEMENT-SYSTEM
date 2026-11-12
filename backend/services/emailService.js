
const transporter = require("../config/emailConfig");

const sendEmail = async ({
  to,
  subject,
  html,
  text,
  attachments = [],
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "VisitPro"}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log("Email sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error;
  }
};

module.exports = sendEmail;
