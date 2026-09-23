import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import config from './config.js';
import AppError from '../utils/appError.js';

const OAuth2 = google.auth.OAuth2;

export const createTransporter = async () => {
  if (
    !config.GOOGLE_CLIENT_ID ||
    !config.GOOGLE_CLIENT_SECRET ||
    !config.GOOGLE_REFRESH_TOKEN ||
    !config.GMAIL_USER
  ) {
    throw new AppError(
      'Email service is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and GMAIL_USER.',
      503
    );
  }

  const oAuth2Client = new OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oAuth2Client.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });

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
