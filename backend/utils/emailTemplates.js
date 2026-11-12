
const emailLayout = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f6fa;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <div style="background:#f47721;padding:25px;text-align:center;color:#ffffff;">
      <h1 style="margin:0;">${process.env.COMPANY_NAME || "VisitPro"}</h1>
      <p style="margin:8px 0 0;">Visitor Management System</p>
    </div>

    <div style="padding:30px;color:#333333;">
      <h2 style="color:#f47721;">${title}</h2>
      ${content}
    </div>

    <div style="padding:18px;text-align:center;background:#fafafa;color:#888;font-size:12px;">
      This is an automated email. Please do not reply.
    </div>
  </div>
</body>
</html>
`;

const visitorRegistrationTemplate = (visitor) =>
  emailLayout(
    "Visitor Registration Received",
    `
      <p>Hello ${visitor.name},</p>
      <p>Your visitor registration has been received successfully.</p>
      <p><strong>Visitor ID:</strong> ${visitor.visitorId}</p>
      <p><strong>Company:</strong> ${visitor.company || "—"}</p>
      <p><strong>Purpose:</strong> ${visitor.purpose}</p>
      <p><strong>Appointment:</strong> ${new Date(visitor.appointmentDate).toLocaleString("en-IN")}</p>
      <p>Your visit is currently awaiting approval.</p>
    `
  );

const approvalTemplate = (visitor) =>
  emailLayout(
    "Visitor Pass Approved",
    `
      <p>Hello ${visitor.name},</p>
      <p>Your visit request has been <strong style="color:green;">approved</strong>.</p>
      <p><strong>Visitor ID:</strong> ${visitor.visitorId}</p>
      <p><strong>Appointment:</strong> ${new Date(visitor.appointmentDate).toLocaleString("en-IN")}</p>
      <p>Please show your QR visitor pass at the reception desk.</p>
    `
  );

const rejectionTemplate = (visitor) =>
  emailLayout(
    "Visitor Request Rejected",
    `
      <p>Hello ${visitor.name},</p>
      <p>Unfortunately, your visit request has been rejected.</p>
      <p><strong>Visitor ID:</strong> ${visitor.visitorId}</p>
      <p><strong>Reason:</strong> ${visitor.rejectionReason || "Please contact the host for details."}</p>
    `
  );

const checkInTemplate = (visitor) =>
  emailLayout(
    "Visitor Checked In",
    `
      <p>Hello ${visitor.name},</p>
      <p>Your office check-in has been recorded successfully.</p>
      <p><strong>Visitor ID:</strong> ${visitor.visitorId}</p>
      <p><strong>Check-in Time:</strong> ${new Date(visitor.checkInTime).toLocaleString("en-IN")}</p>
    `
  );

const checkOutTemplate = (visitor) =>
  emailLayout(
    "Visitor Checked Out",
    `
      <p>Hello ${visitor.name},</p>
      <p>Your office check-out has been recorded successfully.</p>
      <p><strong>Visitor ID:</strong> ${visitor.visitorId}</p>
      <p><strong>Check-out Time:</strong> ${new Date(visitor.checkOutTime).toLocaleString("en-IN")}</p>
      <p>Thank you for visiting us.</p>
    `
  );

module.exports = {
  visitorRegistrationTemplate,
  approvalTemplate,
  rejectionTemplate,
  checkInTemplate,
  checkOutTemplate,
};
