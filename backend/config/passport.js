const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        // This function is called after Google authentication is successful
        const newUser = {
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            avatar: profile.photos[0].value
        };

        try {
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                // If user exists, pass them to the next step
                done(null, user);
            } else {
                // If user doesn't exist, create a new user
                user = await User.create(newUser);
                done(null, user);
            }
        } catch (err) {
            console.error(err);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => done(err, user));
    });
};