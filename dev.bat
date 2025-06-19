@echo off
set NODE_ENV=development
set HOST=127.0.0.1
echo Starting PubMed Research Assistant...
echo Server will be available at http://127.0.0.1:5000
tsx server/index.ts