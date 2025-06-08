import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import config from './config.js';

const OAuth2 = google.auth.OAuth2;

const oAuth2Client = new OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oAuth2Client.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });

export const createTransporter = async () => {
    const { token } = await oAuth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: config.GMAIL_USER,
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      refreshToken: config.GOOGLE_REFRESH_TOKEN,
      accessToken: token,
    },
  });
};
