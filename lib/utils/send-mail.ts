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
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html: `<p>Dear ${name},</p><p>${message}</p><p>Best regards,<br/>Family Tree Team</p>`,
  };

  await transporter.sendMail(mailOptions);
}
