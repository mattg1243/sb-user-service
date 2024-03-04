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
  const verifyUrl = `${CLIENT_HOST}/verify-email?code=${verificationCode}&user=${userId}&email=${userEmail}`;
  const verifyEmail: sgMail.MailDataRequired = {
    to: userEmail,
    from: 'no-reply@orangemusicent.com',
    subject: 'Verify your Sweatshop Beats Account',
    templateId: 'd-1c4e0c086a5d4065a54c474feb47a4b8',
    dynamicTemplateData: {
      verifyUrl,
    },
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
  const resetUrl = `${CLIENT_HOST}/reset-password?token=${resetToken}&email=${userEmail}`;
  const resetPasswordEmail: sgMail.MailDataRequired = {
    to: userEmail,
    from: 'no-reply@orangemusicent.com',
    subject: 'Reset your Sweatshop Beats Password',
    templateId: 'd-c58b5818a4a843529b6682b65b1ef9a9',
    dynamicTemplateData: {
      resetUrl,
    },
  };
  return await sgMail.send(resetPasswordEmail);
};
/**
 * Sends an email to user when a payout is successfully sent.
 * @param userEmail
 * @param paymentPortalUrl - url to open the users preferred payment processors portal
 * @returns
 */
export const sendPayoutSuccessfulEmail = async (
  artistName: string,
  userEmail: string,
  paymentPortalUrl: string,
  summary: string
) => {
  const today = new Date();
  const dateSuffix = `${today.getMonth() + 1}-${today.getFullYear()}`;
  const email: sgMail.MailDataRequired = {
    to: userEmail,
    from: 'no-reply@orangemusicent.com',
    subject: 'Redeem your payout',
    templateId: 'd-b278fedd95fb4f2f805345d4e4bdaaec',
    dynamicTemplateData: {
      paymentPortalUrl,
    },
    attachments: [
      {
        content: Buffer.from(summary).toString('base64'),
        filename: `${artistName.trim()}-${dateSuffix}.csv`,
        disposition: 'attachment',
        type: 'text/csv',
      },
    ],
  };
  return await sgMail.send(email);
};

export const sendPayoutErrorEmail = async (userEmail: string, errDescription: string) => {
  const email: sgMail.MailDataRequired = {
    to: userEmail,
    from: 'no-reply@orangemusicent.com',
    subject: 'Error processing your payout',
    templateId: 'd-fac39172eae84f1ba2741fc3d779e6f9',
    dynamicTemplateData: {
      errDescription,
    },
  };
  return await sgMail.send(email);
};

/**
 * Returns an MailDataRequired object
 * @param to - users email
 * @param subject
 * @param html
 * @returns
 */
const makeMailData = (to: string, subject: string, html: string): sgMail.MailDataRequired => {
  return {
    to,
    subject,
    from: 'no-reply@orangemusicent.com',
    html,
  };
};

// only sent internally
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
