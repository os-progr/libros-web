// ============================================
// PASSPORT GOOGLE OAUTH CONFIGURATION
// ============================================

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { userQueries } = require('./database');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Extract user data from Google profile
            const googleId = profile.id;
            const email = profile.emails[0].value;
            const name = profile.displayName;
            const picture = profile.photos[0]?.value || null;

            // Check if user already exists
            let user = await userQueries.findByGoogleId(googleId);

            if (user) {
                // Update existing user info
                await userQueries.update(googleId, { email, name, picture });
                user = await userQueries.findByGoogleId(googleId);
            } else {
                // Create new user
                const userId = await userQueries.create({
                    googleId,
                    email,
                    name,
                    picture
                });
                user = await userQueries.findById(userId);
            }

            return done(null, user);
        } catch (error) {
            console.error('Error in Google OAuth callback:', error);
            return done(error, null);
        }
    }));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await userQueries.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
