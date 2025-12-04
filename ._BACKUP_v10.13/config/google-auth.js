// ============================================
// PASSPORT GOOGLE OAUTH CONFIGURATION
// ============================================

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { userQueries } = require('./database');

// Get environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/auth/google/callback`
        : 'http://localhost:3000/auth/google/callback');

// Validate required credentials
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('\n❌ CRITICAL ERROR: Missing Google OAuth Credentials');
    console.error('------------------------------------------------');
    console.error('The application cannot start because Google OAuth credentials are missing.');
    console.error('Please set the following environment variables in Railway:');
    console.error('  - GOOGLE_CLIENT_ID');
    console.error('  - GOOGLE_CLIENT_SECRET');
    console.error('\nRefer to the "Variables" tab in your Railway dashboard.');
    console.error('------------------------------------------------\n');

    // We don't throw here to allow the process to exit gracefully or be handled by a process manager
    // But since this is a required dependency, we should probably exit or let it crash.
    // Let's throw a clear error.
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.');
}

console.log('🔐 Google OAuth Configuration:');
console.log('   ✓ Client ID loaded');
console.log('   ✓ Client Secret loaded');
console.log('   Callback URL:', GOOGLE_CALLBACK_URL);

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
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
        if (user) {
            // Check if user is admin
            const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim());
            user.isAdmin = adminEmails.includes(user.email);
        }
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
