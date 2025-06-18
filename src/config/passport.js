import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import userService from '../services/user.service.js';
import userDao from '../dao/user.dao.js';
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
        let user = await userDao.findByGoogleId(profile.id);

        if (!user && profile.emails && profile.emails.length > 0) {
          // If not found by googleId, try to find by email
          user = await userDao.findByEmail(profile.emails[0].value);

          if (user) {
            // If found by email, link Google account
            user.googleId = profile.id;
            await user.save();
          }
        }

        if (!user) {
          // Create a new user if not found
          user = await userService.registerUser({
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

        return done(null, user);
      } catch (err) {
        logger.error('Google authentication error:', err);
        return done(err, null);
      }
    }
  )
);
