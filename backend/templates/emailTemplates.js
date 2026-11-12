
const COMPANY_NAME = process.env.COMPANY_NAME || "VisitPro";

const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));

const emailLayout = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    
    <div style="background:#f97316;padding:25px;text-align:center;color:white;">
      <h1 style="margin:0;">${COMPANY_NAME}</h1>
      <p style="margin:8px 0 0;">Visitor Management System</p>
    </div>

    <div style="padding:30px;color:#333;">
      <h2>${title}</h2>
      ${content}
    </div>

    <div style="background:#f9fafb;padding:20px;text-align:center;color:#777;font-size:12px;">
      <p>Thank you for choosing ${COMPANY_NAME}.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>

  </div>
</body>
</html>
`;

const registrationEmail = (visitor) => {
  const name = escapeHTML(visitor.name);
  const purpose = escapeHTML(visitor.purpose);
  const visitorId = escapeHTML(visitor.visitorId);

  return emailLayout(
    "Visitor Registration Successful!",
    `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your visitor registration has been received successfully.</p>

      <div style="background:#fff7ed;padding:18px;border-radius:8px;">
        <p><strong>Visitor ID:</strong> ${visitorId}</p>
        <p><strong>Purpose:</strong> ${purpose}</p>
        <p><strong>Status:</strong> Pending Approval</p>
      </div>

      <p>You will receive another email once your visit is approved.</p>
    `
  );
};

const approvalEmail = (visitor) => {
  const name = escapeHTML(visitor.name);
  const visitorId = escapeHTML(visitor.visitorId);

  return emailLayout(
    "Your Visit Has Been Approved!",
    `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Good news! Your visit has been approved.</p>
      <p><strong>Visitor ID:</strong> ${visitorId}</p>
      <p>Please show your QR visitor pass at reception.</p>
    `
  );
};

const rejectionEmail = (visitor) => {
  const name = escapeHTML(visitor.name);
  const reason = escapeHTML(visitor.rejectionReason || "No reason provided.");

  return emailLayout(
    "Visit Request Update",
    `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Unfortunately, your visit request has been rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please contact the company for further information.</p>
    `
  );
};

module.exports = {
  registrationEmail,
  approvalEmail,
  rejectionEmail,
};
