# Windows Quick Fix - Network Error Solution

If you get this error on Windows:
```
Error: listen ENOTSUP: operation not supported on socket 0.0.0.0:5000
```

## Solution 1: Use Different Port
```cmd
set NODE_ENV=development
set PORT=3000
npx tsx server/index.ts
```

## Solution 2: Use PowerShell Instead
```powershell
$env:NODE_ENV="development"
$env:PORT="3000"
npx tsx server/index.ts
```

## Solution 3: Kill Existing Process
```cmd
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID [PID] /F

# Then try again
npx tsx server/index.ts
```

## Solution 4: Use Different Network Interface
```cmd
set NODE_ENV=development
set HOST=localhost
npx tsx server/index.ts
```

Once the server starts successfully, you'll see:
```
[express] serving on http://127.0.0.1:3000
```

Open that URL in your browser to access the PubMed Research Assistant.

The application will work with automatic EZProxy authentication for University of Alberta users.