# replit.md

## Overview

This is a PubMed PDF Downloader application that allows users to search for scientific articles on PubMed and download PDFs through a university proxy system (University of Alberta). The application provides a web-based interface for searching articles, managing download queues, and monitoring download progress in real-time.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with WebSocket support for real-time updates
- **Session Management**: In-memory storage with session-based authentication
- **File Operations**: Direct file system operations for PDF storage

### Database Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: PostgreSQL (configured but can be provisioned later)
- **Schema**: Defined in shared schema with users, search results, download queue, and session management tables

## Key Components

### Core Services
1. **PubMed Service**: Handles interaction with PubMed's eUtils API for article searching and metadata retrieval
2. **PDF Downloader Service**: Manages authentication with university proxy and PDF file downloads
3. **Storage Service**: Provides data persistence interface (currently implemented as in-memory storage)

### Main Features
1. **Authentication System**: University proxy login for accessing restricted content
2. **Article Search**: PubMed integration with query building and result management
3. **Download Queue**: Batch download management with status tracking
4. **Real-time Progress**: WebSocket-based progress updates during downloads
5. **File Management**: Local file storage with organized folder structure

### User Interface Components
1. **Authentication Card**: Proxy login form
2. **Search Panel**: PubMed query interface with advanced options
3. **Search Results**: Article listing with selection capabilities
4. **Download Queue**: Queue management with status indicators
5. **Download Status**: Progress tracking and file access

## Data Flow

1. **Authentication Flow**: User logs in through university proxy → Session created → Access granted to protected resources
2. **Search Flow**: User submits query → PubMed API called → Results stored and displayed → User selects articles
3. **Download Flow**: Selected articles added to queue → Download service processes queue → Real-time progress via WebSocket → Files saved locally

## External Dependencies

### Primary Services
- **PubMed eUtils API**: For article search and metadata retrieval
- **University of Alberta Proxy**: For accessing restricted content through institutional access
- **@neondatabase/serverless**: Database connection (Neon PostgreSQL)

### Key Libraries
- **WebSocket**: Real-time communication for download progress
- **node-fetch**: HTTP client for external API calls
- **nanoid**: Session ID generation
- **connect-pg-simple**: PostgreSQL session store

### UI Dependencies
- **Radix UI**: Comprehensive component library for accessible UI elements
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **TanStack Query**: Server state management

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Internal port 5000, external port 80
- **Hot Reload**: Vite development server with HMR support

### Build Process
- **Frontend Build**: Vite builds React app to `dist/public`
- **Backend Build**: esbuild bundles server code to `dist/index.js`
- **Deployment**: Autoscale deployment target on Replit

### File Structure
- `client/`: Frontend React application
- `server/`: Backend Express server and services
- `shared/`: Shared TypeScript types and database schema
- `dist/`: Built application for production

## Recent Changes

- June 18, 2025: Enhanced automated download solution with browser session integration
  - Browser-based authentication system to overcome University EZProxy security blocks
  - Automated session capture and persistence for 2-hour authentication periods
  - Real PDF downloads using saved browser sessions instead of instruction files
  - Browser authentication interface with JavaScript extraction script
  - Session management with automatic validation and expiration handling
  - Fallback to instruction files when browser sessions unavailable or expired
  - API endpoints for browser session storage and status checking
  - Enhanced downloader service with browser session priority logic

- June 17, 2025: Complete PubMed Research Assistant application implemented
  - University of Alberta EZProxy automatic authentication system working
  - Automatic PDF downloading through authenticated EZProxy sessions
  - PubMed search integration with robust XML parsing using xml2js library
  - Download queue management with real-time WebSocket progress tracking
  - Manual PMID input with file upload support
  - Interactive search results table with batch selection
  - Professional academic UI with responsive design
  - Multiple publisher source attempts (Springer, Wiley, Nature, ACS, PMC)
  - Fallback instruction file generation when automatic download fails
  - All API endpoints tested and responding correctly
  - External debugging analysis implemented with robustness improvements

## Changelog

- June 17, 2025: Initial setup and full application development

## User Preferences

Preferred communication style: Simple, everyday language.