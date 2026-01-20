# OAuth Provider Setup Guide

This document details the setup requirements for each OAuth provider supported by the spam detection challenge system.

## Provider Comparison

| Provider | Cost | Approval Time | Localhost | HTTPS Required | Notes |
|----------|------|---------------|-----------|----------------|-------|
| **GitHub** | Free | Instant | ✅ Works | No | Easiest to set up |
| **Google** | Free | Instant | ✅ Works (warning) | No | Shows "unverified app" warning; needs verification for 100+ users |
| **Twitter/X** | Free | 24-48h | ✅ After approval | No | Developer account approval required |
| **Yandex** | Free | Instant | ✅ Works | No | Popular in Russia/CIS |
| **TikTok** | Free | Days/weeks | ⚠️ May need tunnel | Preferred | Developer account approval can be slow |
| **Discord** | Free | Instant | ✅ Works | No | Very popular among gaming communities |

## Provider Setup Instructions

### GitHub

**Requirements:** Free, instant approval

**Setup:**
1. Go to https://github.com/settings/developers
2. Click **"OAuth Apps"** tab (NOT "GitHub Apps" - they are different!)
3. Click **"New OAuth App"**
4. Fill in:
   - **Application name:** Any name (e.g., "Spam Detection")
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/v1/oauth/github/callback`
5. Click **"Register application"**
6. Copy the **Client ID**
7. Click **"Generate a new client secret"** and copy it

**Environment Variables:**
```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

**Notes:**
- GitHub OAuth Apps and GitHub Apps are different. You need an **OAuth App**.
- Client ID format: short alphanumeric string or starts with `Ov23li...`
- If you see `Iv23li...` prefix, you created a GitHub App by mistake.

---

### Google

**Requirements:** Free, instant approval

**Setup:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project if you don't have one
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - App name, support email, developer email (required)
5. Select **"Web application"** as application type
6. Add to **Authorized redirect URIs:** `http://localhost:3000/api/v1/oauth/google/callback`
7. Click **"Create"**
8. Copy **Client ID** and **Client Secret**

**Environment Variables:**
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

**Notes:**
- Localhost testing shows an "unverified app" warning - click "Advanced" → "Go to app"
- For production with 100+ users, you need to verify your OAuth consent screen
- Uses PKCE (Proof Key for Code Exchange) for enhanced security

---

### Twitter/X

**Requirements:** Free tier available, requires developer account approval

**Setup:**
1. Go to https://developer.twitter.com/en/portal/projects
2. Apply for a developer account if you don't have one (may take 24-48h)
3. Create a new Project and App
4. In **User authentication settings**, click **"Set up"**
5. Enable **OAuth 2.0**
6. Set **App permissions:** Read (minimum)
7. Set **Type of App:** Web App
8. Add **Callback URL:** `http://localhost:3000/api/v1/oauth/twitter/callback`
9. Add a **Website URL** (can be localhost for testing)
10. Save and copy **Client ID** and **Client Secret**

**Environment Variables:**
```env
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```

**Notes:**
- Developer account approval is required before you can create apps
- Free tier has limited API calls (may affect high-traffic sites)
- Uses PKCE for enhanced security

---

### Yandex

**Requirements:** Free, instant approval

**Setup:**
1. Go to https://oauth.yandex.com/client/new
2. Fill in:
   - **App name:** Any name
   - **Platforms:** Web services
   - **Redirect URI:** `http://localhost:3000/api/v1/oauth/yandex/callback`
3. Under **Data access**, select **"Access to user avatar and nickname"** (login:info)
4. Click **"Create app"**
5. Copy **ID** (Client ID) and **Password** (Client Secret)

**Environment Variables:**
```env
YANDEX_CLIENT_ID=your_client_id
YANDEX_CLIENT_SECRET=your_client_secret
```

**Notes:**
- Popular authentication option in Russia and CIS countries
- Works on localhost without any special configuration
- Interface is available in Russian and English

---

### TikTok

**Requirements:** Free, requires developer account approval (can take days/weeks)

**Setup:**
1. Go to https://developers.tiktok.com/
2. Create a developer account and wait for approval
3. Once approved, create an app in the Developer Portal
4. Add the **"Login Kit"** product to your app
5. In Login Kit settings:
   - Add **Redirect URI:** `http://localhost:3000/api/v1/oauth/tiktok/callback`
   - Request **"user.info.basic"** scope
6. Copy **Client Key** (= Client ID) and **Client Secret**

**Environment Variables:**
```env
TIKTOK_CLIENT_ID=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
```

**Notes:**
- Developer account approval can take several days to weeks
- TikTok prefers HTTPS; localhost may require ngrok
- Uses PKCE for enhanced security
- The user ID returned is called "open_id" in TikTok's system

---

### Discord

**Requirements:** Free, instant approval

**Setup:**
1. Go to https://discord.com/developers/applications
2. Click **"New Application"**
3. Give it a name and create
4. Go to **OAuth2** section in the sidebar
5. Add **Redirect URL:** `http://localhost:3000/api/v1/oauth/discord/callback`
6. Copy **Client ID** from the OAuth2 page
7. Click **"Reset Secret"** to generate and copy the **Client Secret**

**Environment Variables:**
```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

**Notes:**
- Scopes needed: `identify` (for user ID)
- Works on localhost without special configuration
- Very popular among gaming and tech communities

---

## Testing on Localhost

Most providers work on localhost (`http://localhost:3000`), but some have restrictions:

### Providers that work on localhost:
- GitHub ✅
- Google ✅ (shows warning)
- Twitter ✅
- Yandex ✅
- Discord ✅

### Providers that may require HTTPS:
- **TikTok** - Prefers HTTPS

### Using ngrok for HTTPS testing:
```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run dev

# In another terminal, create a tunnel
ngrok http 3000
```

ngrok will give you an HTTPS URL like `https://abc123.ngrok.io`. Update your OAuth app's callback URL to use this URL instead of localhost.

Remember to also set `BASE_URL` environment variable to match:
```env
BASE_URL=https://abc123.ngrok.io
```

## Security Considerations

1. **Never commit credentials** - Use environment variables or `.env` files (which should be in `.gitignore`)
2. **Use HTTPS in production** - All OAuth flows should use HTTPS in production
3. **Validate state parameter** - The server automatically validates the OAuth state to prevent CSRF attacks
4. **Token handling** - Access tokens are used once to fetch user ID and then discarded
5. **User privacy** - Only the provider's unique user ID is stored; no email or personal info is retained
