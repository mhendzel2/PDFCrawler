# Debug Guide

## Development Environment

### Local Setup
```bash
git clone <repository>
cd pubmed-research-assistant
npm install
npm run dev
```

### Debug Configuration
- Application runs on port 5000
- API endpoints: `/api/*`
- WebSocket endpoint: `/ws`
- Frontend dev server integrated with backend

## Common Issues

### 1. Authentication Problems
**Symptoms**: 401 errors, "Authentication failed" messages

**Debug Steps**:
```bash
# Test University proxy connection
curl -X POST http://localhost:5000/api/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"your_ccid","password":"your_password"}'

# Expected response:
# {"success":true,"sessionId":"<session_id>","message":"Authentication successful"}
```

**Common Causes**:
- Incorrect University of Alberta credentials (most common)
- Network connectivity to proxy server
- Proxy server maintenance/downtime
- VPN/network restrictions blocking proxy access

**Note**: The 401 "Authentication failed" response is normal when testing without valid UofA credentials. You need your actual CCID and password to authenticate successfully.

### 2. PubMed Search Issues
**Symptoms**: Empty search results, API errors

**Debug Steps**:
```bash
# Test PubMed API directly
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=cancer&retmode=json&retmax=5"

# Test application search
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"cancer","maxResults":5}'
```

### 3. Download Problems
**Symptoms**: PDFs not downloading, "PDF not accessible" errors

**Debug Steps**:
1. Verify authentication status
2. Check file system permissions
3. Test individual PMID download
4. Monitor network requests

```bash
# Check download folder permissions
ls -la ~/Documents/downloaded_pdfs/

# Test manual PMID addition
curl -X POST http://localhost:5000/api/add-manual-pmids \
  -H "Content-Type: application/json" \
  -d '{"pmids":["34567890"]}'
```

### 4. WebSocket Connection Issues
**Symptoms**: No real-time progress updates

**Debug Steps**:
1. **Check Browser Network Tab**: Filter by WS to see WebSocket connections
2. **Multiple Tab Support**: The application now supports multiple browser tabs per session
3. **Test WebSocket Connection**:
```javascript
// Test WebSocket connection in browser console
const ws = new WebSocket('ws://localhost:5000/ws?sessionId=test');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.onerror = (e) => console.log('Error:', e);
```

**Recent Improvements**:
- Enhanced to support multiple tabs per session
- Better error handling and connection cleanup
- Automatic fallback and reconnection logic

## Application Logs

### Backend Logs
- Request/response logging automatically enabled
- WebSocket connection events logged
- Download progress tracked

### Frontend Console
- React component errors
- API request failures
- WebSocket connection status

## File System Debug

### Download Directory
```bash
# Check download folder
ls -la ~/Documents/downloaded_pdfs/

# Monitor file creation
watch -n 1 'ls -la ~/Documents/downloaded_pdfs/'

# Check disk space
df -h ~/Documents/
```

### Permissions
```bash
# Ensure write permissions
chmod 755 ~/Documents/downloaded_pdfs/

# Check ownership
ls -la ~/Documents/ | grep downloaded_pdfs
```

## Network Debug

### API Connectivity
```bash
# Test PubMed API
curl -I https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi

# Test University proxy
curl -I https://login.ezproxy.library.ualberta.ca/login

# Test local API
curl http://localhost:5000/api/download-folder
```

### Proxy Configuration
If behind corporate firewall:
```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=https://proxy.company.com:8080
npm run dev
```

## Database Debug (If Using PostgreSQL)

### Connection Test
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check tables
psql $DATABASE_URL -c "\dt"
```

### Migration Status
```bash
# Run migrations
npm run db:migrate

# Check migration status
npm run db:status
```

## Performance Debug

### Memory Usage
```bash
# Monitor Node.js memory
node --inspect=0.0.0.0:9229 server/index.ts

# Check system memory
free -h
```

### Request Performance
```bash
# Time API requests
time curl http://localhost:5000/api/search-results

# Monitor response times in logs
grep "in [0-9]*ms" logs/application.log
```

## Browser Debug

### Developer Tools
1. Open Network tab to monitor API calls
2. Check Console for JavaScript errors
3. Monitor WebSocket connections
4. Inspect React component state

### Local Storage
```javascript
// Check session storage
console.log(localStorage.getItem('sessionId'));

// Clear session data
localStorage.clear();
```

## External Service Debug

### PubMed API Status
- Check NCBI service status: https://www.ncbi.nlm.nih.gov/
- Verify API rate limits not exceeded
- Test different search terms

### University Proxy Status
- Verify University of Alberta library access
- Check proxy server maintenance schedules
- Test credentials through library website

## Error Codes Reference

### HTTP Status Codes
- `200`: Success
- `401`: Authentication required/failed
- `404`: Resource not found
- `500`: Internal server error

### Application Error Messages
- "Authentication failed": Invalid credentials or proxy unavailable
- "PDF not accessible": Article not available through institutional access
- "Search failed": PubMed API connectivity issue
- "Session not authenticated": Need to log in first

## Recovery Procedures

### Reset Application State
```bash
# Clear download queue
curl -X DELETE http://localhost:5000/api/download-queue

# Clear search results (automatic on new search)
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","maxResults":1}'
```

### Restart Services
```bash
# Restart development server
npm run dev

# Force restart with clean cache
rm -rf node_modules/.cache
npm run dev
```

### File System Cleanup
```bash
# Clean temporary files
rm -rf tmp/*

# Reset download directory
rm -rf ~/Documents/downloaded_pdfs/*
mkdir -p ~/Documents/downloaded_pdfs/
```