import nodemailer from "nodemailer";

/**
 * Email service using Gmail SMTP
 * Requires SMTP_USER and SMTP_PASS environment variables
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn("[Email] SMTP credentials not configured. Emails will be logged to console.");
      return null;
    }

    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log("[Email] SMTP transporter initialized");
  }

  return transporter;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const transport = getTransporter();

  // Fallback to console logging if SMTP not configured
  if (!transport) {
    console.log("\n==============================================");
    console.log("EMAIL (Console Mode - SMTP not configured)");
    console.log("==============================================");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`\n${options.text || options.html}`);
    console.log("==============================================\n");
    return true;
  }

  try {
    const info = await transport.sendMail({
      from: `"Smart Lifestyle Assistant" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`[Email] Message sent to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  code: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 TUM Account Verification</h1>
        </div>
        <div class="content">
          <p>Hello ${firstName},</p>
          <p>Thank you for linking your TUM student account to Smart Lifestyle Assistant!</p>
          <p>Your verification code is:</p>
          <div class="code">${code}</div>
          <p><strong>This code will expire in 15 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Best regards,<br>Smart Lifestyle Assistant Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${firstName},

Your verification code is: ${code}

This code will expire in 15 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Smart Lifestyle Assistant Team
  `;

  return sendEmail({
    to: email,
    subject: "Verify your TUM account - Smart Lifestyle Assistant",
    html,
    text,
  });
}
