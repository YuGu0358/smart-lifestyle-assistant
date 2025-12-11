import { sendVerificationEmail as sendEmail } from "./emailService";

/**
 * Email Verification Service
 * Generates verification codes and sends emails to TUM students
 */

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if a TUM email is valid
 * TUM emails should end with @tum.de or @mytum.de
 */
export function isValidTumEmail(email: string): boolean {
  const tumEmailPattern = /^[a-zA-Z0-9._%+-]+@(tum\.de|mytum\.de)$/i;
  return tumEmailPattern.test(email);
}

/**
 * Send verification email to TUM student using real SMTP service
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  studentName?: string
): Promise<boolean> {
  try {
    const firstName = studentName || "TUM Student";
    const success = await sendEmail(email, firstName, code);
    
    if (success) {
      console.log(`[EmailVerification] Verification email sent to ${email}`);
    } else {
      console.warn(`[EmailVerification] Failed to send email to ${email}`);
    }
    
    return success;
  } catch (error) {
    console.error("[EmailVerification] Error sending verification email:", error);
    return false;
  }
}

/**
 * Check if verification code has expired
 */
export function isVerificationExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true;
  return new Date() > expiryDate;
}

/**
 * Get verification expiry time (15 minutes from now)
 */
export function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15);
  return expiry;
}
