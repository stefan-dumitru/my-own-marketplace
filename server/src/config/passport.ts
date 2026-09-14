import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { findOrCreateGoogleUser } from "../services/auth.service.js";
import { env } from "./env.js";

export const isGoogleOAuthConfigured = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL,
);

if (isGoogleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL: env.GOOGLE_CALLBACK_URL!,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          done(new Error("Google profile did not include an email address"));
          return;
        }
        findOrCreateGoogleUser({ googleId: profile.id, email, name: profile.displayName })
          .then((user) => done(null, user))
          .catch(done);
      },
    ),
  );
}

export { passport };
