# Package Information

## Project Files Ready for Download/External Debugging

The PubMed Research Assistant application is fully prepared for external development and debugging. All source code, documentation, and configuration files are included.

### Core Application Files

#### Frontend (React/TypeScript)
- `client/src/App.tsx` - Main application component with routing
- `client/src/pages/home.tsx` - Primary interface with authentication, search, and download management
- `client/src/components/` - UI components including:
  - `authentication-card.tsx` - University proxy login
  - `search-panel.tsx` - PubMed search with manual PMID input
  - `search-results.tsx` - Interactive results table
  - `download-queue.tsx` - Queue management with progress tracking
  - `download-status.tsx` - File management and status display
- `client/src/lib/api.ts` - API client with typed endpoints
- `client/index.html` - Application entry point

#### Backend (Node.js/Express/TypeScript)
- `server/index.ts` - Main server entry point
- `server/routes.ts` - API endpoints with WebSocket integration
- `server/storage.ts` - Data storage interface (in-memory with PostgreSQL support)
- `server/services/` - Business logic:
  - `pubmed.ts` - PubMed API integration
  - `downloader.ts` - PDF download service with proxy authentication
- `server/vite.ts` - Development server configuration

#### Shared Types
- `shared/schema.ts` - Database schema and validation with Drizzle ORM

#### Configuration
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Frontend build configuration
- `tailwind.config.ts` - Styling configuration
- `tsconfig.json` - TypeScript configuration
- `drizzle.config.ts` - Database ORM configuration

### Documentation Files

#### Setup and Usage
- `README.md` - Complete project overview, installation, and usage guide
- `DEPLOYMENT.md` - Production deployment instructions and configuration
- `DEBUG.md` - Comprehensive troubleshooting and debug procedures
- `replit.md` - Project architecture and user preferences

### Key Features Implemented

1. **University Authentication**: Secure login through University of Alberta EZProxy
2. **PubMed Integration**: Full API integration with advanced search capabilities
3. **Download Management**: Batch PDF downloads with real-time progress
4. **Modern UI**: Professional interface with responsive design
5. **WebSocket Support**: Real-time updates during download operations
6. **File Management**: Organized PDF storage with metadata tracking

### External Dependencies

#### Production Dependencies
- React 18 with TypeScript for frontend
- Express.js with TypeScript for backend
- TanStack Query for state management
- Radix UI with shadcn/ui for components
- Tailwind CSS for styling
- Drizzle ORM for database operations
- WebSocket (ws) for real-time communication
- node-fetch for HTTP requests

#### Development Tools
- Vite for development server and builds
- ESBuild for fast compilation
- PostCSS for CSS processing
- TypeScript for type safety

### Ready for External Development

The application is fully functional and can be:
- Downloaded as a complete package
- Deployed to any Node.js hosting environment
- Extended with additional features
- Integrated with external systems
- Customized for different institutions

All files maintain proper TypeScript typing, error handling, and documentation for easy maintenance and debugging.