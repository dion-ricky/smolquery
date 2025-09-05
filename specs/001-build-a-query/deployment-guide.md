# SmolQuery Deployment Guide

This guide covers deploying SmolQuery to various hosting platforms and production considerations.

## Table of Contents

- [Production Build](#production-build)
- [Environment Configuration](#environment-configuration)
- [Deployment Platforms](#deployment-platforms)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Logging](#monitoring-and-logging)

## Production Build

### Build Process

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run type checking
pnpm type-check

# Run tests
pnpm test

# Build for production
pnpm build
```

The build process:
1. Compiles TypeScript to JavaScript
2. Bundles assets with Vite
3. Optimizes and minifies code
4. Generates source maps
5. Creates `dist/` directory with production files

### Build Output

```
dist/
├── index.html              # Main HTML file
├── assets/                 # Static assets
│   ├── index-[hash].js     # Main JavaScript bundle
│   ├── index-[hash].css    # Compiled CSS
│   └── vendor-[hash].js    # Third-party dependencies
├── vite.svg               # Application icon
└── [other static assets]
```

## Environment Configuration

### Required Environment Variables

#### Production

```bash
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id
VITE_BIGQUERY_PROJECT_ID=your_production_project_id

# Optional: Custom API endpoints
VITE_API_BASE_URL=https://api.yourdomain.com
```

#### Development

```bash
# Google OAuth Configuration (Development)
VITE_GOOGLE_CLIENT_ID=your_dev_google_client_id
VITE_BIGQUERY_PROJECT_ID=your_dev_project_id

# Local development
VITE_API_BASE_URL=http://localhost:3000
```

### Google Cloud Configuration

#### OAuth 2.0 Setup

1. **Create OAuth 2.0 Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Select "Web application"

2. **Configure Authorized URLs**:
   ```
   Authorized JavaScript origins:
   - https://yourdomain.com
   - http://localhost:5173 (for development)
   
   Authorized redirect URIs:
   - https://yourdomain.com
   - http://localhost:5173 (for development)
   ```

#### BigQuery API Setup

1. **Enable BigQuery API**:
   - In Google Cloud Console
   - Navigate to "APIs & Services" > "Library"
   - Search for "BigQuery API" and enable it

2. **Set up IAM Permissions**:
   - Users need "BigQuery User" role minimum
   - For advanced features: "BigQuery Data Viewer" or "BigQuery Admin"

## Deployment Platforms

### Vercel (Recommended)

Vercel provides seamless deployment for Vite applications.

#### Setup

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
# From project root
vercel

# For production deployment
vercel --prod
```

#### Configuration

Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_GOOGLE_CLIENT_ID": "@google-client-id",
    "VITE_BIGQUERY_PROJECT_ID": "@bigquery-project-id"
  }
}
```

### Netlify

#### Setup

1. **Connect Repository**:
   - Go to [Netlify](https://netlify.com)
   - Connect your GitHub repository
   - Configure build settings

#### Build Configuration

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  PNPM_VERSION = "8"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages

#### Setup

1. **Configure Repository**:
   - Enable GitHub Pages in repository settings
   - Set source to "GitHub Actions"

2. **Create Workflow**:

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
        
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
      
    - name: Build
      run: pnpm build
      env:
        VITE_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
        VITE_BIGQUERY_PROJECT_ID: ${{ secrets.BIGQUERY_PROJECT_ID }}
        
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

#### Build and Run

```bash
# Build image
docker build -t smolquery .

# Run container
docker run -p 8080:80 smolquery
```

## Security Considerations

### Environment Variables

1. **Never commit secrets** to version control
2. **Use platform-specific secret management**:
   - Vercel: Environment Variables in dashboard
   - Netlify: Site settings > Environment variables
   - GitHub Actions: Repository secrets

### OAuth Security

1. **Restrict OAuth origins** to production domains only
2. **Use HTTPS** in production (required by Google OAuth)
3. **Implement proper token refresh** logic
4. **Clear tokens** on sign out

### Content Security Policy

Add CSP headers in production:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://apis.google.com;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://accounts.google.com https://bigquery.googleapis.com;
  frame-src https://accounts.google.com;
">
```

## Performance Optimization

### Build Optimization

1. **Enable build optimizations** in `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          editor: ['monaco-editor']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
```

### Runtime Optimization

1. **Lazy load components**:
```typescript
const QueryEditor = defineAsyncComponent(() => import('./components/QueryEditor.vue'));
```

2. **Implement caching**:
```typescript
// Cache query results
const queryCache = new Map<string, QueryResult>();
```

3. **Optimize bundle size**:
```bash
# Analyze bundle size
pnpm build
npx vite-bundle-analyzer dist
```

### CDN Configuration

Use CDN for static assets:

```typescript
// vite.config.ts
export default defineConfig({
  base: 'https://cdn.yourdomain.com/',
  // ... other config
});
```

## Monitoring and Logging

### Error Tracking

#### Sentry Integration

```bash
pnpm add @sentry/vue @sentry/tracing
```

```typescript
// main.ts
import * as Sentry from "@sentry/vue";

Sentry.init({
  app,
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});
```

### Analytics

#### Google Analytics

```typescript
// Analytics setup
import { gtag } from 'ga-gtag';

gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: document.title,
  page_location: window.location.href
});
```

### Health Checks

Create a health check endpoint:

```typescript
// api/health.ts
export async function GET() {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Google OAuth credentials set up
- [ ] BigQuery API enabled
- [ ] Performance tests passing
- [ ] Security review completed

### Production Deployment

- [ ] Build successfully completes
- [ ] Static assets loading correctly
- [ ] OAuth flow working
- [ ] BigQuery integration functional
- [ ] Error tracking configured
- [ ] Analytics implemented
- [ ] HTTPS enabled
- [ ] Performance monitoring active

### Post-deployment

- [ ] Smoke tests passing
- [ ] User acceptance testing
- [ ] Performance benchmarks met
- [ ] Error rates within acceptable limits
- [ ] Documentation updated
- [ ] Team notified of deployment

## Troubleshooting

### Common Issues

#### OAuth Not Working

1. **Check authorized origins**:
   - Ensure production domain is listed
   - Verify HTTPS is enabled

2. **Verify client ID**:
   - Check environment variable is set correctly
   - Ensure client ID matches OAuth configuration

#### Build Failures

1. **Check Node version**: Ensure Node.js 18+
2. **Clear cache**: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
3. **Check TypeScript errors**: `pnpm type-check`

#### Performance Issues

1. **Analyze bundle size**: Use bundle analyzer
2. **Enable compression**: Ensure gzip is enabled
3. **Check network timing**: Use browser dev tools
4. **Monitor API response times**: Check BigQuery performance

### Support

For deployment issues:
1. Check the project's GitHub issues
2. Review deployment platform documentation
3. Contact the development team
4. Check error logs and monitoring dashboards
