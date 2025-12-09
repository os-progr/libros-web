# Session Deserialization Error - Fix Guide

## Problem
You're seeing this error in your Railway logs:
```
Error: Failed to deserialize user out of session
```

This happens when session data in the database references users that no longer exist (orphaned sessions).

## Solution

### Option 1: Use the Web Route (Recommended for Railway)

1. **Visit the cleanup URL** in your browser:
   ```
   https://your-railway-domain.railway.app/cleanup-sessions
   ```

2. **You'll see a report** showing:
   - Number of expired sessions deleted
   - Number of orphaned sessions deleted
   - Total sessions remaining

3. **Restart your Railway deployment** (optional but recommended)

### Option 2: Run the Cleanup Script Locally

If you have local database access:

```bash
node scripts/cleanup_sessions.js
```

## What Was Fixed

### 1. Enhanced Passport Deserialization (`config/google-auth.js`)
- Now checks if user exists before deserializing
- Returns `false` to clear invalid sessions instead of crashing
- Logs warnings for debugging

### 2. Created Session Cleanup Utility (`scripts/cleanup_sessions.js`)
- Removes expired sessions
- Removes orphaned sessions (sessions with deleted user IDs)
- Can be run manually or via web route

### 3. Added Web Route (`/cleanup-sessions`)
- Accessible via browser
- Shows detailed cleanup report
- Safe to run multiple times

## Prevention

The session store is configured to automatically:
- Clear expired sessions every 15 minutes
- Expire sessions after 24 hours
- Use MySQL for persistent session storage

However, orphaned sessions (from deleted users) need manual cleanup, which is why we added these tools.

## Monitoring

After cleanup, monitor your Railway logs. You should no longer see:
```
Error: Failed to deserialize user out of session
```

If you still see warnings like:
```
⚠️  User with ID X not found in database. Session will be cleared.
```

This is normal - it means the fix is working and clearing invalid sessions automatically.
