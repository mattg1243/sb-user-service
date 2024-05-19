import { getNonSubbedUsers } from '../services/User.service';
import { sendSubReminderEmail } from '../utils/sendgridConfig';
import cron from 'node-cron';

export const sendSubReminderTask = cron.schedule('0 19 * * *', async () => {
  console.log('Scheduling subReminder cron task...');
  try {
    const users = await getNonSubbedUsers();
    const currentDate = new Date();

    for (const user of users) {
      const signUpDate = new Date(user.created_at);
      const diffTime = Math.abs(currentDate.getTime() - signUpDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 1) {
        await sendSubReminderEmail(user.email);
        user.subReminderSent = true;
        await user.save();
      }
    }
  } catch (err) {
    console.error('Error in subReminder task:', err);
  }
});
