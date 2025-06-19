# Windows Setup Guide - PubMed Research Assistant

## Quick Fix for Windows Users

If you get the error: `'NODE_ENV' is not recognized as an internal or external command`, follow these steps:

### Method 1: Use the Windows Batch Script (Recommended)
```cmd
# After extracting and running npm install
dev.bat
```

### Method 2: Replace package.json
```cmd
# Replace the package.json with Windows-compatible version
copy package-windows.json package.json

# Install cross-env
npm install cross-env

# Now npm run dev will work
npm run dev
```

### Method 3: Manual Command
```cmd
# Set environment variable and run directly
set NODE_ENV=development
npx tsx server/index.ts
```

## Complete Windows Setup

1. **Extract the package**
   ```cmd
   tar -xzf pubmed-research-assistant-v3-final.tar.gz
   cd pubmed-research-assistant-v3-final
   ```

2. **Install dependencies**
   ```cmd
   npm install
   npm install cross-env
   ```

3. **Start the application**
   ```cmd
   dev.bat
   ```

4. **Access the application**
   Open your browser to `http://localhost:5000`

## Troubleshooting

**If dev.bat doesn't work:**
- Make sure Node.js and npm are installed
- Try running: `npx tsx server/index.ts` directly
- Check that all dependencies installed correctly with `npm list`

**If authentication fails:**
- Verify your University of Alberta CCID credentials
- Check internet connection
- Try authenticating directly on the University library website first

**If PDFs don't download:**
- This is normal - the system will create instruction files instead
- Use the provided EZProxy URLs to access articles manually
- Check the download folder for instruction files

The application is fully functional on Windows with these compatibility fixes.