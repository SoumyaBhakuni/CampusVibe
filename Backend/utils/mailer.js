import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 1. Re-using your original transporter setup
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your arpitjoshi564@gmail.com
    pass: process.env.EMAIL_PASS, // Your app password
  },
});

// Helper for sending mail
const sendMail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Error sending email to ${mailOptions.to}:`, error);
  }
};

// 2. Access Granted Email (for authController)
export const sendWelcomeEmail = async (email, randomPassword) => {
  const mailOptions = {
    from: `"CampusVibe Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Event Organizer Access Has Been Granted',
    html: `<h1>Welcome to CampusVibe!</h1>
           <p>Your request to organize an event has been approved.</p>
           <p>You can now log in using these credentials:</p>
           <p><b>Email:</b> ${email}</p>
           <p><b>Temporary Password:</b> ${randomPassword}</p>
           <p>You will be required to change this password upon your first login.</p>`,
  };
  await sendMail(mailOptions);
};

// 3. Registration Status Email (for registrationController)
export const sendRegistrationEmail = async (studentEmail, eventName, paymentStatus) => {
  const isPending = paymentStatus === 'Pending';
  const mailOptions = {
    from: `"CampusVibe Events" <${process.env.EMAIL_USER}>`,
    to: studentEmail,
    subject: isPending 
      ? `Registration Received (Pending Verification) for ${eventName}`
      : `Registration Successful for ${eventName}!`,
    html: isPending
      ? `<p>Your registration for <b>${eventName}</b> has been received. It is currently <b>pending payment verification</b> by the event organizer.</p>`
      : `<p>Congratulations! Your registration for <b>${eventName}</b> is confirmed. We look forward to seeing you there.</p>`,
  };
  await sendMail(mailOptions);
};

// 4. Payment Rejected Email (for organizerController)
export const sendPaymentRejectedEmail = async (studentEmail, eventName, reason) => {
  const mailOptions = {
    from: `"CampusVibe Events" <${process.env.EMAIL_USER}>`,
    to: studentEmail,
    subject: `Registration Rejected for ${eventName}`,
    html: `<p>Your registration for <b>${eventName}</b> has been rejected by the organizer.</p>
           <p><b>Reason:</b> ${reason || 'Payment verification failed.'}</p>
           <p>Please re-register with valid payment proof or contact the event organizer.</p>`,
  };
  await sendMail(mailOptions);
};

// 5. Resource Request Mail (for requirementController)
export const sendResourceRequestMail = async ({ inchargeEmail, inchargeName, organizerName, event, items }) => {
  const itemsHtml = items.map(item => `<li><b>${item.name}</b>: ${item.quantity}</li>`).join('');
  
  const mailOptions = {
    from: `"${organizerName} (CampusVibe)" <${process.env.EMAIL_USER}>`,
    to: inchargeEmail,
    subject: `New Resource Request for Event: ${event.eventName}`,
    html: `<h3>New Resource Request</h3>
           <p>Hello ${inchargeName},</p>
           <p>A new request has been submitted by <b>${organizerName}</b> for the event <b>${event.eventName}</b> (on ${new Date(event.startTime).toLocaleDateString()}).</p>
           <p><b>Items Requested:</b></p>
           <ul>${itemsHtml}</ul>
           <p>Please coordinate with the organizer to approve this request.</p>`,
  };
  await sendMail(mailOptions);
};

// 6. Attendance Report Email (for attendanceController)
export const sendAttendanceReportEmail = async ({ employee, event, classes, committeeList }) => {
  let classTables = '';
  for (const [classKey, data] of classes.entries()) {
    const studentList = data.students.map(s => `<li>${s.name} (Roll: ${s.classRollNo})</li>`).join('');
    classTables += `<h4>For your class: ${classKey}</h4><ul>${studentList}</ul><hr>`;
  }

  // --- THIS IS THE FIX ---
  // The variable was `committee.map` but the arg was `committeeList`
  const committeeListHtml = committeeList.map(m => `<li>${m.Student.name} (Roll: ${m.Student.classRollNo}, ${m.Student.Course.courseName})</li>`).join('');
  // --- END OF FIX ---

  const mailOptions = {
    from: `"CampusVibe System" <${process.env.EMAIL_USER}>`,
    to: employee.email,
    subject: `Attendance Report: ${event.eventName}`,
    html: `<h3>Event Attendance Report</h3>
           <p>Hello ${employee.name},</p>
           <p>The following students were marked as "Attended" at the event <b>${event.eventName}</b>, which conflicted with your scheduled classes.</p>
           ${classTables}
           <p><b>Generalised Organizing Committee (for your reference):</b></p>
           <ul>${committeeListHtml}</ul>`,
  };
  await sendMail(mailOptions);
};

// 7. Certificate Email (for automationController)
export const sendCertificateEmail = async (studentEmail, studentName, certificateType, eventName) => {
  const mailOptions = {
    from: `"CampusVibe Events" <${process.env.EMAIL_USER}>`,
    to: studentEmail,
    subject: `Your ${certificateType} for ${eventName} is here!`,
    html: `<p>Dear ${studentName},</p>
           <p>Thank you for your involvement in <b>${eventName}</b>!</p>
           <p>Please find your <b>${certificateType}</b> attached.</p>`,
    // attachments: [ { filename: 'certificate.pdf', content: ... (PDF generation logic) } ]
  };
  await sendMail(mailOptions);
};

// 8. Final Report Email (for automationController)
export const sendFinalReportEmail = async (email, eventName, reportData) => {
  const mailOptions = {
    from: `"CampusVibe System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Final Report for ${eventName} (Access Revoked)`,
    html: `<p>Your access as an organizer for <b>${eventName}</b> has now expired.</p>
           <p>Attached is the final analytics and participant report for your records. Your account is now set to "Guest".</p>`,
    // attachments: [ { filename: 'final_report.pdf', content: reportData } ]
  };
  await sendMail(mailOptions);
};

// 9. Event Canceled Email (for eventController)
export const sendEventCanceledEmail = async (studentEmail, eventName) => {
  const mailOptions = {
    from: `"CampusVibe Events" <${process.env.EMAIL_USER}>`,
    to: studentEmail,
    subject: `Event Canceled: ${eventName}`,
    html: `<p>We regret to inform you that the event <b>${eventName}</b> has been canceled by the organizer.</p>
           <p>Your registration is now void. If you paid a fee, please contact the event organizer for a refund.</p>`,
  };
  await sendMail(mailOptions);
};

// =================================================================
// ✅ 10. ACCESS EXPIRY WARNING EMAIL (New Function)
// =================================================================
export const sendAccessWarningEmail = async (email, expiryDate) => {
  const mailOptions = {
    from: `"CampusVibe Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Action Required: Your Organizer Access is Expiring Soon',
    html: `<p>This is an automated reminder that your Event Organizer access for CampusVibe will expire in <b>7 days</b> on ${new Date(expiryDate).toLocaleDateString()}.</p>
           <p>Please ensure all event activities, including leaderboard finalization, are complete by this date.</p>`,
  };
  await sendMail(mailOptions);
};