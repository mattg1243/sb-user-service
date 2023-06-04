import sgMail from '@sendgrid/mail';
import { CLIENT_HOST } from '../app';

const sgApiKey = process.env.SENDGRID_API_KEY || '';
sgMail.setApiKey(sgApiKey);

/**
 * Sends an email with a magic link that verifies the users account and email address.
 * @param verificationCode - Unique code that is saved in the database.
 * @param userEmail - Users provided email address.
 */
export const sendVerificationEmail = async (verificationCode: string, userEmail: string, userId: string) => {
  const verifyEmail: sgMail.MailDataRequired = {
    to: userEmail,
    from: 'mattgallucci@orangemusicent.com',
    subject: 'Verify your Sweatshop Beats Account',
    html: `<p>Visit ${CLIENT_HOST}/verify-email?code=${verificationCode}&user=${userId} to verify your account<p>`,
  };
  return await sgMail.send(verifyEmail);
};
