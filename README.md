# SmolQuery

A lightweight, modern web-based SQL query interface for BigQuery built with Vue 3, TypeScript, and Vite.

## Features

- 🔍 **Interactive Query Editor** - Monaco Editor with SQL syntax highlighting and autocompletion
- 📊 **Results Visualization** - Clean, paginated result tables with export capabilities
- 🏗️ **Schema Browser** - Explore your BigQuery datasets and tables
- ⚙️ **Settings Management** - Configure your query environment and preferences
- 🔒 **Google OAuth Integration** - Secure authentication with BigQuery
- 🌙 **Dark Mode Support** - Toggle between light and dark themes
- ⚡ **Fast Development** - Built with Vite for lightning-fast development experience
- 🧪 **Comprehensive Testing** - Unit tests, integration tests, and performance benchmarks
- 🎯 **TypeScript First** - Full type safety throughout the application

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Google Cloud Project with BigQuery API enabled
- Google OAuth 2.0 credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dion-ricky/smolquery.git
cd smolquery
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Google OAuth credentials
```

4. Start the development server:
```bash
pnpm dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Development

### Project Structure

```
smolquery/
├── src/
│   ├── components/          # Vue components
│   │   ├── QueryEditor.vue     # Monaco SQL editor
│   │   ├── ResultsPanel.vue    # Query results display
│   │   ├── SchemaPanel.vue     # Database schema browser
│   │   ├── SettingsPanel.vue   # Application settings
│   │   ├── PanelManager.vue    # Panel layout management
│   │   └── ThemeToggle.vue     # Dark/light mode toggle
│   ├── models/              # TypeScript data models
│   │   ├── Query.ts            # Query model with validation
│   │   ├── UserSession.ts      # User authentication state
│   │   └── Panel.ts            # UI panel management
│   ├── services/            # Business logic services
│   │   ├── queryService.ts     # BigQuery execution logic
│   │   └── authService.ts      # Google OAuth integration
│   ├── api/                 # API layer
│   │   └── query.ts            # Query execution endpoints
│   └── assets/              # Static assets
├── tests/                   # Test suites
│   └── performance/         # Performance benchmarks
├── specs/                   # Design specifications
│   └── 001-build-a-query/   # Feature specifications
└── scripts/                 # Development scripts
```

### Available Scripts

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm preview               # Preview production build

# Testing
pnpm test                  # Run all tests
pnpm test:unit            # Run unit tests only
pnpm test:performance     # Run performance benchmarks
pnpm test:watch           # Run tests in watch mode

# Code Quality
pnpm lint                 # Run ESLint
pnpm lint:fix            # Fix ESLint issues
pnpm type-check          # Run TypeScript checks

# Development Tools
pnpm create-feature       # Create new feature structure
pnpm check-prerequisites  # Validate development environment
```

### Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Model validation, service logic, component behavior
- **Integration Tests**: End-to-end query execution workflows
- **Performance Tests**: Query execution benchmarks and memory usage
- **Contract Tests**: API endpoint validation

Run specific test suites:
```bash
# Run model tests
pnpm vitest run src/models/__tests__/

# Run service tests  
pnpm vitest run src/services/__tests__/

# Run performance benchmarks
pnpm vitest run tests/performance/
```

## Architecture

### Core Models

#### Query Model
```typescript
interface QueryPayload {
  id: string;
  sql: string;
  name?: string;
  status?: 'draft' | 'running' | 'completed' | 'failed';
  createdAt?: string;
  updatedAt?: string;
  lastError?: string | null;
}
```

#### UserSession Model
```typescript
interface UserSessionPayload {
  userId?: string | null;
  provider?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: string | null;
}
```

#### Panel Model
```typescript
interface PanelPayload {
  id: string;
  type: 'results' | 'schema' | 'settings' | 'console';
  title?: string;
  open?: boolean;
  order?: number;
}
```

### Services

#### Query Service
Handles BigQuery integration and query execution:
- Authenticated BigQuery API calls
- Mock implementation for development
- Error handling and result formatting

#### Authentication Service
Manages Google OAuth flow:
- Google Sign-In integration
- Token management and refresh
- Session persistence

### Component Architecture

The application uses a panel-based layout system:
- **QueryEditor**: Monaco-based SQL editor with syntax highlighting
- **ResultsPanel**: Displays query results in paginated tables
- **SchemaPanel**: Interactive BigQuery schema browser
- **SettingsPanel**: User preferences and configuration
- **PanelManager**: Handles panel visibility and keyboard shortcuts

## API Reference

### Query Execution

```typescript
// Execute a query
const result = await executeQuery(query, userSession);

interface QueryResult {
  jobId?: string;
  rows: Record<string, unknown>[];
  schema: { name: string; type: string }[];
}
```

### Authentication

```typescript
// Sign in with Google
const session = await signInWithGoogle();

// Check authentication status
const isAuthenticated = session.isAuthenticated();

// Sign out
await signOut();
```

## Configuration

### Environment Variables

```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_BIGQUERY_PROJECT_ID=your_project_id
```

### Google Cloud Setup

1. Create a Google Cloud Project
2. Enable the BigQuery API
3. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`

## Performance

SmolQuery is optimized for performance:
- **Fast Query Execution**: Sub-second query response times
- **Efficient Memory Usage**: <1KB per query object, <512 bytes per panel
- **Responsive UI**: Panel operations complete in <0.1ms
- **Concurrent Operations**: Handles 100+ concurrent queries efficiently

Performance benchmarks are included in `tests/performance/` and can be run with:
```bash
pnpm test:performance
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Maintain test coverage above 80%
- Use conventional commit messages
- Update documentation for API changes

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Vue 3](https://vuejs.org/) and [Vite](https://vitejs.dev/)
- SQL editing powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- Testing with [Vitest](https://vitest.dev/)
- BigQuery integration via [Google Cloud APIs](https://cloud.google.com/bigquery/docs/reference/rest)
