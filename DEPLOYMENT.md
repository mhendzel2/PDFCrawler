# Deployment Guide

## Local Development Setup

1. **Prerequisites**
   ```bash
   # Install Node.js 20+
   # Clone the repository
   # Navigate to project directory
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   - Application runs on `http://localhost:5000`
   - Backend API: `http://localhost:5000/api/*`
   - WebSocket: `ws://localhost:5000/ws`

## Production Deployment

### Replit Deployment (Recommended)
1. The project is configured for Replit autoscale deployment
2. Use the Deploy button in Replit interface
3. Environment variables are managed through Replit secrets

### Manual Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Configuration

### Required Environment Variables
- `NODE_ENV`: Set to "production" for production builds

### Optional Configuration
- `PORT`: Server port (defaults to 5000)
- `DATABASE_URL`: PostgreSQL connection string (optional)
- `DOWNLOAD_FOLDER`: Custom download directory path (defaults to ~/Documents/downloaded_pdfs)
- `PROXY_URL`: University proxy URL (defaults to University of Alberta)

## Database Setup (Optional)

The application uses in-memory storage by default. For persistent storage:

1. **PostgreSQL Setup**
   ```bash
   # Install PostgreSQL
   # Create database
   createdb pubmed_assistant
   ```

2. **Configure Connection**
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/pubmed_assistant"
   ```

3. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

## File System Permissions

Ensure the application has write permissions to the download directory:
- Default: `~/Documents/downloaded_pdfs/`
- Custom: Set via `DOWNLOAD_FOLDER` environment variable

## Network Configuration

### Firewall Rules
- Incoming: Port 5000 (HTTP/WebSocket)
- Outgoing: Ports 80, 443 (PubMed API, University proxy)

### Proxy Configuration
The application connects to:
- `https://eutils.ncbi.nlm.nih.gov/` (PubMed API)
- `https://login.ezproxy.library.ualberta.ca/` (University proxy)
- Various journal websites for PDF downloads

## Security Considerations

### Authentication
- University credentials are not persisted
- Session tokens expire automatically
- HTTPS required for production deployment

### Data Privacy
- No personal data stored permanently
- Download history cleared on restart
- Session cleanup on browser close

## Monitoring and Logging

### Application Logs
- Request/response logging for API endpoints
- WebSocket connection status
- Download progress and errors

### Health Checks
- `GET /api/download-folder` - Verify file system access
- `GET /api/download-queue` - Check application state

## Troubleshooting

### Common Deployment Issues

1. **Port Binding Errors**
   - Ensure port 5000 is available
   - Check firewall configurations

2. **File Permission Errors**
   - Verify write access to download directory
   - Check user permissions

3. **Network Connectivity**
   - Test PubMed API access
   - Verify university proxy connectivity

4. **WebSocket Connection Failures**
   - Check proxy/load balancer WebSocket support
   - Verify CORS configuration

### Debug Commands
```bash
# Check application health
curl http://localhost:5000/api/download-folder

# Test WebSocket connection
wscat -c ws://localhost:5000/ws?sessionId=test

# View application logs
tail -f logs/application.log
```

## Performance Optimization

### Production Settings
- Enable compression middleware
- Configure request rate limiting
- Implement connection pooling for database

### Scaling Considerations
- Stateless session management
- External file storage for PDFs
- Load balancer configuration for WebSockets

## Backup and Recovery

### Data Backup
- Download folder contents
- Database dump (if using PostgreSQL)
- Application configuration files

### Recovery Procedures
- Restore download directory
- Rebuild application from source
- Reconfigure environment variables