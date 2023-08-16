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
    from: 'no-reply@orangemusicent.com',
    subject: 'Verify your Sweatshop Beats Account',
    html: `<p>Visit ${CLIENT_HOST}/verify-email?code=${verificationCode}&user=${userId}&email=${userEmail} to verify your account<p>`,
  };
  return await sgMail.send(verifyEmail);
};

/**
 * Sends an email with a magic link allowing users to reset their password.
 * @param resetToken - Unique code that is saved in the database.
 * @param userEmail - User provided email address
 * @returns
 */
export const sendResetPasswordEmail = async (resetToken: string, userEmail: string) => {
  const resetPasswordEmail: sgMail.MailDataRequired = {
    to: userEmail,
    from: 'no-reply@orangemusicent.com',
    subject: 'Reset your Sweatshop Beats Password',
    html: `<p>Visit ${CLIENT_HOST}/reset-password?token=${resetToken}&email=${userEmail} to reset your password<p>`,
  };
  return await sgMail.send(resetPasswordEmail);
};

export const notifyMeOnNewUser = async (artistName: string, email: string) => {
  const notiEmail: sgMail.MailDataRequired = {
    to: 'mattgallucci@orangemusicent.com',
    from: 'no-reply@orangemusicent.com',
    subject: 'You just got a little richer',
    html: `<h1>Congrats</h1><p>A new user ${artistName} just registered with the email ${email}</p>`,
  };

  return await sgMail.send(notiEmail);
};

export const notifyMeOnNewSub = async (email: string, subTier: string) => {
  const notiEmail: sgMail.MailDataRequired = {
    to: 'mattgallucci@orangemusicent.com',
    from: 'no-reply@orangemusicent.com',
    subject: 'Thats money dood 🤑',
    html: `<h1>Congrats</h1><p>User with email ${email} just bought a ${subTier} subscription</p>`,
  };

  return await sgMail.send(notiEmail);
};
