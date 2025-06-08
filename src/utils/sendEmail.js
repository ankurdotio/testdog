import { createTransporter } from '../config/email.config.js';
import config from '../config/config.js';

export const sendVerificationEmail = async (to, verificationLink) => {
  const transporter = await createTransporter();
  const mailOptions = {
    from: `"Testdog" <${config.GMAIL_USER}>`,
    to,
    subject: 'Verify your email',
    html: `
      <p>Click the link below to verify your email:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `,
  };

  return transporter.sendMail(mailOptions);
};
