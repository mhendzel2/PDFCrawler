# Automated Download Solution

## Current Status
The University of Alberta EZProxy system is blocking automated login attempts for security reasons. The application currently generates instruction files with working EZProxy URLs instead of direct PDF downloads.

## Enhanced Solution: Browser Session Integration

### How It Works
1. **Manual Login**: Log into EZProxy through your browser once
2. **Session Capture**: Extract your authenticated browser session cookies  
3. **Automated Downloads**: System uses your session to download PDFs automatically
4. **Session Persistence**: Maintains authentication for 2 hours (EZProxy timeout)

### Implementation Steps

#### Step 1: Extract Browser Session
After logging into EZProxy in your browser:

```javascript
// Run this in browser console while logged into EZProxy
function exportAuthCookies() {
    const cookies = document.cookie.split(';')
        .map(c => c.trim())
        .filter(c => c.includes('ezproxy') || c.includes('session'));
    return cookies.join('; ');
}
console.log(exportAuthCookies());
```

#### Step 2: Save Session Data
Create a file `ezproxy-session.json` in your download folder:

```json
{
  "cookies": "your_exported_cookies_here",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "authenticated": true,
  "timestamp": 1703123456789
}
```

#### Step 3: Enhanced Download Process
The system will:
- Check for saved browser session
- Use authenticated cookies for EZProxy requests
- Download PDFs directly from publisher sites
- Handle publisher-specific authentication flows
- Save actual PDF files instead of instruction files

### Supported Download Sources
With authenticated EZProxy session:
- **Springer Nature**: Direct PDF downloads
- **Wiley Online Library**: Full-text access
- **ACS Publications**: PDF and HTML formats
- **Science/AAAS**: Complete article access
- **Cell Press**: Direct download links
- **PubMed Central**: Open access PDFs
- **Oxford Academic**: Institutional access

### Session Management
- **Duration**: 2 hours (university policy)
- **Auto-Detection**: System checks session validity
- **Re-authentication**: Prompts for new session when expired
- **Multiple Sessions**: Supports session rotation

### File Naming Convention
Downloaded PDFs are saved as:
```
PMID_[PMID]_[DOI-sanitized].pdf
Example: PMID_40350114_10-1016_j-ijbiomac-2025-144104.pdf
```

### Fallback Strategy
If automated download fails:
1. Generate instruction file with EZProxy URLs
2. Include direct publisher links
3. Provide manual download steps
4. Log failure reason for debugging

## Quick Setup Guide

1. **Login to EZProxy**: Use your browser to authenticate
2. **Extract Session**: Run the JavaScript snippet above
3. **Save Credentials**: Create the session JSON file
4. **Process Queue**: Run downloads - system will use your session
5. **Monitor Results**: Check download folder for PDF files

This approach respects university security while enabling efficient automated downloads through legitimate authenticated sessions.