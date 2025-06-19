# PubMed Research Assistant

A web-based application for searching PubMed articles and downloading PDFs through University of Alberta proxy authentication.

## Features

- **University Proxy Authentication**: Secure login through University of Alberta's EZProxy system
- **PubMed Search**: Advanced search with date filters and result limits
- **Manual PMID Input**: Direct input of PubMed IDs with file upload support
- **Interactive Results**: Table-based selection of articles from search results
- **Download Queue**: Batch management of PDF downloads with real-time progress
- **Real-time Updates**: WebSocket-based progress tracking during downloads

## System Requirements

- Node.js 20+
- npm or yarn
- University of Alberta credentials for proxy access

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Components**: Radix UI with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API**: RESTful endpoints with WebSocket support
- **Authentication**: Session-based with University of Alberta proxy
- **Data Storage**: In-memory storage (configurable for PostgreSQL)

### External Services
- **PubMed eUtils API**: Article search and metadata retrieval
- **University of Alberta EZProxy**: Institutional access to restricted content
- **PDF Sources**: DOI resolution and PMC direct access

## API Endpoints

### Authentication
- `POST /api/authenticate` - University proxy login
- `GET /api/session/:sessionId` - Check session status

### Search
- `POST /api/search` - Search PubMed articles
- `GET /api/search-results` - Get current search results

### Download Management
- `POST /api/add-manual-pmids` - Add PMIDs manually
- `POST /api/add-to-queue` - Add selected articles to queue
- `GET /api/download-queue` - Get current download queue
- `DELETE /api/download-queue/:id` - Remove item from queue
- `DELETE /api/download-queue` - Clear entire queue
- `POST /api/download` - Start download process
- `GET /api/download-folder` - Get download folder path

### WebSocket
- `WS /ws?sessionId=<id>` - Real-time download progress updates

## Usage

1. **Authentication**: Enter University of Alberta credentials
2. **Search**: Use PubMed search with keywords, dates, and result limits
3. **Selection**: Choose articles from search results or input PMIDs manually
4. **Download**: Manage queue and start batch PDF downloads
5. **Monitor**: Track progress and access downloaded files

## Configuration

### Environment Variables
- `NODE_ENV`: Development/production mode
- `DATABASE_URL`: PostgreSQL connection (optional)

### Download Location
PDFs are saved to: `~/Documents/downloaded_pdfs/`

## File Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Application pages
│   │   ├── lib/            # Utilities and API client
│   │   └── hooks/          # Custom React hooks
│   └── index.html
├── server/                 # Backend Express server
│   ├── services/           # Business logic services
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data storage interface
│   └── index.ts            # Server entry point
├── shared/                 # Shared TypeScript types
│   └── schema.ts           # Database schema and validation
└── dist/                   # Built application (production)
```

## Development Notes

### WebSocket Connection
The application uses WebSockets for real-time download progress updates. The frontend connects to `/ws` with a session ID parameter.

### Error Handling
- Authentication failures return 401 status
- Network errors are logged and displayed to users
- Download failures are tracked per PMID with error messages

### Security
- University credentials are not stored persistently
- Session-based authentication with automatic cleanup
- PDF downloads respect institutional access rights

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Verify University of Alberta credentials
2. **No PDFs Downloaded**: Check institutional access to articles
3. **Search Not Working**: Verify PubMed API connectivity
4. **WebSocket Errors**: Check browser WebSocket support

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development`

## License

Academic use only - University of Alberta