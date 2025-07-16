import nodemailer from "nodemailer";

interface SendMailOptions {
  to: string;
  name: string;
  subject: string;
  message: string;
}

export async function sendMailToContactedUser({
  to,
  name,
  subject,
  message,
}: SendMailOptions) {
  // Configure your SMTP transport (use environment variables for credentials)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER || process.env.GMAIL_PASS,
    to,
    subject,
    html: `<p>Dear ${name},</p><p>${message}</p><p>Best regards,<br/>Family Tree Team</p>`,
  };

  await transporter.sendMail(mailOptions);
}
