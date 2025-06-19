# External Debugging Setup Guide

## Package Contents: pubmed-research-assistant-v4-browser-auth.tar.gz

### Complete Application Source
- Full TypeScript/React application with Node.js backend
- Browser session authentication system
- PubMed search and PDF download functionality
- All documentation and setup guides

## Quick Start for External Environment

### 1. Extract and Install
```bash
tar -xzf pubmed-research-assistant-v4-browser-auth.tar.gz
cd pubmed-research-assistant-v4/
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Application runs on `http://localhost:5000`

### 3. Test Browser Authentication
1. Navigate to University EZProxy login page
2. Complete manual authentication  
3. Use JavaScript extraction script from Browser Auth card
4. Save session data for automated downloads

## Debugging University EZProxy Issues

### Connection Reset Analysis
The University of Alberta EZProxy returns `ECONNRESET` errors for automated authentication attempts. This is intentional security blocking, not a bug.

**Evidence in logs:**
```
EZProxy authentication error: FetchError: request to https://login.ezproxy.library.ualberta.ca/login failed, reason: socket hang up
```

### Browser Session Solution
The application implements browser-based authentication that:
- Captures authenticated sessions from manual logins
- Uses saved sessions for automated PDF downloads
- Respects university security policies
- Provides real PDF files instead of instruction files

## Key Debugging Points

### 1. Session Management
**File:** `server/services/browser-auth.ts`
- Session validation logic
- 2-hour expiration handling
- Cookie storage and retrieval

### 2. Download Priority Logic  
**File:** `server/services/downloader.ts`
- Browser session attempted first
- EZProxy fallback (will fail due to blocking)
- Instruction file generation as final fallback

### 3. Frontend Authentication
**File:** `client/src/components/browser-auth-card.tsx`
- JavaScript session extraction script
- Session validation interface
- User guidance for setup process

## Testing Authentication Flow

### Manual EZProxy Test
```bash
curl -I https://login.ezproxy.library.ualberta.ca/login
```
Expected: Connection refused or reset (security blocking)

### Browser Session Test
1. Save valid session data using provided JavaScript
2. Monitor logs for "Using browser session for automated download"
3. Verify PDF files appear in downloads folder

### Fallback Instruction Files
When no browser session available:
- Instruction files generated with working EZProxy URLs
- Contains multiple publisher access methods
- Provides manual download steps

## Environment Variables

### Optional Configuration
```bash
DOWNLOAD_FOLDER=/path/to/downloads  # Default: ~/Documents/downloaded_pdfs
PROXY_URL=https://custom.proxy.url  # Default: University of Alberta
```

### Required for Production
```bash
NODE_ENV=production
PORT=5000
```

## External Deployment

### Requirements
- Node.js 18+ 
- TypeScript support
- Network access to PubMed APIs
- File system write permissions

### Production Build
```bash
npm run build
npm start
```

### Docker Alternative
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## Troubleshooting External Issues

### Common Environment Problems
1. **Node.js Version**: Requires Node 18+ for ES modules
2. **TypeScript Errors**: Run `npm install -g typescript`
3. **Port Conflicts**: Change PORT environment variable
4. **File Permissions**: Ensure write access to downloads folder

### University-Specific Issues
1. **Different EZProxy URLs**: Update proxy base URL in downloader service
2. **Authentication Methods**: Modify session extraction script
3. **Publisher Access**: Verify institutional subscriptions

### Network Debugging
```bash
# Test PubMed API access
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=cancer&retmax=1"

# Test EZProxy accessibility
curl -v https://login.ezproxy.library.ualberta.ca/login
```

## Integration with Other Systems

### Reference Managers
The browser session approach aligns with how established tools work:
- Papers, EndNote, Zotero use similar authentication patterns
- Manual authentication + session capture
- Automated access through saved state

### Institutional Systems
Adaptable to other universities by:
- Modifying proxy URLs in configuration
- Updating session extraction scripts
- Adjusting publisher access patterns

This debugging package provides complete source access for external analysis and modification of the authentication and download systems.