import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';
import config from './config.js';
import logger from '../loggers/winston.logger.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.debug('Google profile:', JSON.stringify(profile));

        // Find user by googleId or email
        let user = await User.findOne({ googleId: profile.id });

        if (!user && profile.emails && profile.emails.length > 0) {
          // If not found by googleId, try to find by email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // If found by email, link Google account
            user.googleId = profile.id;
            await user.save({ validateBeforeSave: false });
          }
        }

        if (!user) {
          // Create a new user if not found
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar:
              profile.photos && profile.photos.length > 0
                ? profile.photos[0].value
                : undefined,
          });
          logger.info(`New user created via Google: ${user.email}`);
        }

        // Always update the Google access token
        if (accessToken) {
          user.googleAccessToken = accessToken;
          await user.save({ validateBeforeSave: false });
        }

        return done(null, user);
      } catch (err) {
        logger.error('Google authentication error:', err);
        return done(err, null);
      }
    }
  )
);
