# Local Deployment Guide - PubMed Research Assistant v3

## Overview
This package contains the complete PubMed Research Assistant with automatic EZProxy authentication and PDF downloading capabilities. The system is specifically configured for University of Alberta users but can be adapted for other institutions.

## Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- University of Alberta CCID credentials (for PDF downloads)

## Quick Start

### 1. Extract and Setup
```bash
# Extract the package
tar -xzf pubmed-research-assistant-v3-final.tar.gz
cd pubmed-research-assistant-v3-final

# Install dependencies
npm install
```

### 2. Start the Application

**For Windows users:**
```cmd
# Install cross-env for Windows compatibility
npm install cross-env

# Option 1: Use the Windows batch script
dev.bat

# Option 2: Use npm with cross-env (replace package.json first)
copy package-windows.json package.json
npm run dev
```

**For Mac/Linux users:**
```bash
# Development mode (recommended for local use)
npm run dev
```

The application will start on `http://localhost:5000`

### 3. Access the Application
Open your browser and navigate to `http://localhost:5000`

## Features

### Automatic EZProxy Authentication
- Seamless University of Alberta proxy login
- Session management for authenticated downloads
- Automatic re-authentication when needed

### Automatic PDF Downloads
- Direct PDF retrieval through EZProxy
- Multiple publisher support (Springer, Wiley, Nature, ACS, PMC)
- Fallback instruction files when automatic download fails

### PubMed Integration
- Advanced search with date filters and result limits
- Robust XML parsing with xml2js library
- Real-time search results with article metadata

### Download Management
- Batch download processing
- Real-time progress tracking via WebSocket
- Queue management with status updates

## Configuration

### Environment Variables (Optional)
Create a `.env` file in the root directory:

```bash
# Custom download folder (default: ~/Documents/downloaded_pdfs)
DOWNLOAD_FOLDER=/path/to/your/downloads

# Different university proxy (default: University of Alberta)
PROXY_URL=https://your-university-proxy.edu/login

# Custom port (default: 5000)
PORT=3000
```

### University Configuration
To adapt for other universities:
1. Update `PROXY_URL` in `.env` file
2. Modify authentication logic in `server/services/downloader.ts`
3. Update EZProxy URL patterns as needed

## Usage Guide

### 1. Authentication
- Click "Authenticate" on the main page
- Enter your University of Alberta CCID and password
- System stores credentials for automatic PDF downloads

### 2. Search Articles
- Use the search panel to find articles on PubMed
- Apply date filters and result limits as needed
- Browse results with title, authors, journal, and year

### 3. Download Articles
- Select articles from search results
- Add to download queue
- Click "Start Download" to begin automatic PDF retrieval
- Monitor progress in real-time

### 4. Access Downloaded Files
- PDFs are saved to your configured download folder
- Instruction files are created when automatic download fails
- Use the provided EZProxy URLs for manual access

## File Structure
```
project/
├── client/          # React frontend application
├── server/          # Express backend with services
├── shared/          # Shared TypeScript types and schemas
├── attached_assets/ # Documentation and examples
├── README.md        # Project overview
├── DEBUG.md         # Troubleshooting guide
└── DEPLOYMENT.md    # Production deployment guide
```

## Troubleshooting

### Common Issues

**Authentication Fails**
- Verify CCID credentials are correct
- Check internet connection
- University may have updated authentication requirements

**No PDFs Downloaded**
- Some articles may not be available even with institutional access
- Check instruction files for manual access URLs
- Try accessing articles directly through library website

**Search Not Working**
- PubMed API may be temporarily unavailable
- Check console logs for specific errors
- Verify search query format

### Advanced Debugging
- Check browser console for frontend errors
- Monitor server logs in terminal
- Refer to `DEBUG.md` for detailed troubleshooting

## Production Deployment

For production deployment on a server:
```bash
# Build the application
npm run build

# Start in production mode
npm start
```

See `DEPLOYMENT.md` for detailed production setup instructions.

## Support

For issues specific to:
- **University of Alberta access**: Contact library support
- **Technical problems**: Check `DEBUG.md` or console logs
- **Feature requests**: Modify source code as needed

## License and Usage

This application is designed for academic research purposes. Ensure compliance with:
- University policies for automated access
- Publisher terms of service
- Copyright and fair use guidelines

---

**Version**: 3.0 Final
**Last Updated**: June 17, 2025
**Compatibility**: University of Alberta EZProxy system