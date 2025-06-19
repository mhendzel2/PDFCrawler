# Browser-Based Authentication Guide

The University of Alberta EZProxy system blocks automated login attempts for security. This guide shows how to use browser-based authentication for automated PDF downloads.

## How It Works

1. **Manual Authentication**: Log into EZProxy through your browser once
2. **Session Capture**: System captures your authenticated browser session
3. **Automated Downloads**: System uses your session to download PDFs automatically
4. **Session Persistence**: Your login is saved for 2 hours (EZProxy timeout)

## Setup Process

### Step 1: Manual EZProxy Login
1. Open your browser and go to: `https://login.ezproxy.library.ualberta.ca/login`
2. Log in with your University of Alberta CCID credentials
3. Verify you can access a restricted journal article

### Step 2: Capture Browser Session
Once logged in to EZProxy, you have two options:

**Option A: Browser Extension (Recommended)**
1. Install a cookie export extension (like "Get cookies.txt LOCALLY")
2. Export cookies for `*.ezproxy.library.ualberta.ca`
3. Save the cookie file to your download folder

**Option B: Manual Cookie Extraction**
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Copy cookies for `login.ezproxy.library.ualberta.ca`
4. Note down the User-Agent string from Network tab

### Step 3: Import Session to Application
1. Use the "Import Browser Session" feature in the application
2. Upload your exported cookies or paste them manually
3. System validates the session and enables automated downloads

## Automated Download Process

Once your browser session is imported:

1. **Search Articles**: Use PubMed search as normal
2. **Add to Queue**: Select articles for download
3. **Automatic Processing**: System uses your authenticated session to:
   - Access EZProxy URLs directly
   - Download PDFs from multiple publisher sources
   - Handle redirects and authentication automatically
   - Save files with proper naming

## Session Management

- **Duration**: Sessions last 2 hours (University policy)
- **Auto-Refresh**: System attempts to keep sessions active
- **Re-authentication**: Manual login required after timeout
- **Multiple Sessions**: Support for multiple concurrent sessions

## Supported Publishers

With authenticated EZProxy access:
- Springer Nature
- Wiley Online Library
- ACS Publications
- Science/AAAS
- Cell Press
- Oxford Academic
- PubMed Central (PMC)
- Taylor & Francis

## Troubleshooting

**Session Invalid**
- Check if 2 hours have passed since login
- Verify cookies are from correct domain
- Re-authenticate manually in browser

**Downloads Still Fail**
- Some articles may not be available even with institutional access
- Publisher may require additional authentication steps
- Check if article is open access (doesn't need EZProxy)

**Cookie Export Issues**
- Use Incognito/Private browsing for clean session
- Ensure you're logged into EZProxy, not just the university portal
- Some browsers may block cookie export extensions

## Browser Extension Code

For advanced users, here's a JavaScript snippet to extract cookies:

```javascript
// Run in browser console while logged into EZProxy
function exportEZProxyCookies() {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const ezproxyCookies = cookies.filter(c => 
        c.includes('ezproxy') || c.includes('session') || c.includes('auth')
    );
    console.log('EZProxy Cookies:', ezproxyCookies.join('; '));
    return ezproxyCookies.join('; ');
}

exportEZProxyCookies();
```

This hybrid approach respects university security policies while enabling automated downloads through legitimate authenticated sessions.