# SmolQuery Developer Guide

This guide provides comprehensive information for developers contributing to or extending SmolQuery.

## Table of Contents

- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Code Standards](#code-standards)
- [Testing Strategy](#testing-strategy)
- [Feature Development](#feature-development)
- [Debugging](#debugging)
- [Performance Guidelines](#performance-guidelines)

## Development Setup

### Prerequisites

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **pnpm**: Install with `npm install -g pnpm`
- **VS Code** (recommended): With recommended extensions
- **Git**: For version control
- **Google Cloud Account**: For BigQuery integration

### Initial Setup

1. **Clone and Setup**:
```bash
git clone https://github.com/dion-ricky/smolquery.git
cd smolquery
pnpm install
```

2. **Environment Configuration**:
```bash
cp .env.example .env
# Edit .env with your Google OAuth credentials
```

3. **Development Server**:
```bash
pnpm dev
```

### Recommended VS Code Extensions

Create `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Git Hooks

We use Husky for git hooks. After installation:
```bash
pnpm prepare
```

This enables:
- **Pre-commit**: Linting and formatting
- **Pre-push**: Running tests
- **Commit-msg**: Conventional commit validation

## Architecture Overview

### Project Structure

```
smolquery/
├── src/
│   ├── components/          # Vue components
│   │   ├── __tests__/       # Component tests
│   │   └── index.ts         # Component exports
│   ├── models/              # Data models
│   │   ├── __tests__/       # Model tests
│   │   ├── Query.ts         # Query model
│   │   ├── UserSession.ts   # Session model
│   │   └── Panel.ts         # Panel model
│   ├── services/            # Business logic
│   │   ├── __tests__/       # Service tests
│   │   ├── queryService.ts  # Query execution
│   │   └── authService.ts   # Authentication
│   ├── api/                 # API layer
│   │   ├── __tests__/       # API tests
│   │   └── query.ts         # Query endpoints
│   ├── assets/              # Static assets
│   ├── App.vue              # Root component
│   ├── main.ts              # Application entry
│   └── style.css            # Global styles
├── tests/
│   └── performance/         # Performance tests
├── specs/
│   └── 001-build-a-query/   # Feature specifications
└── scripts/                 # Development scripts
```

### Design Patterns

#### Model-Service-Component Pattern

1. **Models**: Data structures with validation
2. **Services**: Business logic and external API calls
3. **Components**: UI presentation and user interaction

#### Dependency Flow

```
Components → Services → Models
     ↓
   API Layer
```

### State Management

SmolQuery uses a lightweight state management approach:

- **Local Component State**: Vue's reactive system
- **Prop Drilling**: For simple parent-child communication
- **Event Bus**: For cross-component communication
- **LocalStorage**: For persistence

## Code Standards

### TypeScript Guidelines

1. **Strict Type Safety**:
```typescript
// Good
interface QueryResult {
  jobId?: string;
  rows: Record<string, unknown>[];
  schema: { name: string; type: string }[];
}

// Avoid
const result: any = await executeQuery(query);
```

2. **Use Type Guards**:
```typescript
function isQuery(obj: unknown): obj is Query {
  return obj instanceof Query && typeof obj.id === 'string';
}
```

3. **Prefer Interfaces over Types**:
```typescript
// Good
interface UserSessionPayload {
  userId?: string;
  accessToken?: string;
}

// Less preferred
type UserSessionPayload = {
  userId?: string;
  accessToken?: string;
}
```

### Vue Component Guidelines

1. **Use Script Setup**:
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  query: Query;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: true
});

const emit = defineEmits<{
  execute: [query: Query];
  update: [query: Query];
}>();
</script>
```

2. **Component Naming**:
   - Use PascalCase for components
   - Use descriptive names: `QueryEditor`, not `Editor`
   - Include component type: `ResultsPanel`, `SettingsModal`

3. **Props and Events**:
```vue
<script setup lang="ts">
// Props with defaults
interface Props {
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false
});

// Typed events
const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();
</script>
```

### Styling Guidelines

1. **Use Tailwind Classes**:
```vue
<template>
  <div class="flex flex-col space-y-4 p-6 bg-white dark:bg-gray-800">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
      Query Results
    </h2>
  </div>
</template>
```

2. **Custom CSS Minimal**:
```css
/* Only for complex layouts or animations */
.query-editor {
  @apply relative overflow-hidden;
}

.query-editor .monaco-editor {
  @apply h-full w-full;
}
```

### Error Handling

1. **Service Layer**:
```typescript
export async function executeQuery(query: Query, session?: UserSession): Promise<QueryResult> {
  try {
    query.validate();
    
    if (session?.isAuthenticated()) {
      return await executeBigQueryQuery(query, session);
    } else {
      return generateMockData(query);
    }
  } catch (error) {
    console.error('Query execution failed:', error);
    throw new Error(`Query execution failed: ${error.message}`);
  }
}
```

2. **Component Layer**:
```vue
<script setup lang="ts">
import { ref } from 'vue';

const error = ref<string | null>(null);
const loading = ref(false);

async function handleExecute() {
  try {
    error.value = null;
    loading.value = true;
    
    const result = await executeQuery(query.value);
    // Handle success
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
}
</script>
```

## Testing Strategy

### Test Types

1. **Unit Tests**: Individual functions and classes
2. **Component Tests**: Vue component behavior
3. **Integration Tests**: Service interactions
4. **Performance Tests**: Benchmarks and memory usage
5. **Contract Tests**: API endpoint validation

### Testing Guidelines

1. **Test File Structure**:
```
src/
├── models/
│   ├── Query.ts
│   └── __tests__/
│       └── Query.test.ts
```

2. **Test Naming**:
```typescript
describe('Query model', () => {
  describe('constructor', () => {
    it('constructs with required fields', () => {
      // Test implementation
    });
    
    it('sets default values for optional fields', () => {
      // Test implementation
    });
  });
});
```

3. **Test Coverage**:
   - Models: 100% coverage
   - Services: 90%+ coverage
   - Components: 80%+ coverage

### Writing Tests

1. **Model Tests**:
```typescript
import { describe, it, expect } from 'vitest';
import Query from '../Query';

describe('Query model', () => {
  it('validates successfully with valid data', () => {
    const query = new Query({
      id: 'test-1',
      sql: 'SELECT 1'
    });
    
    expect(() => query.validate()).not.toThrow();
  });
});
```

2. **Service Tests**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { executeQuery } from '../queryService';

describe('queryService', () => {
  it('executes query with mock data when unauthenticated', async () => {
    const query = new Query({ id: 'test', sql: 'SELECT 1' });
    const result = await executeQuery(query);
    
    expect(result.rows).toBeDefined();
    expect(result.schema).toBeDefined();
  });
});
```

3. **Component Tests**:
```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import QueryEditor from '../QueryEditor.vue';

describe('QueryEditor', () => {
  it('emits execute event when run button clicked', async () => {
    const wrapper = mount(QueryEditor, {
      props: { query: new Query({ id: 'test', sql: 'SELECT 1' }) }
    });
    
    await wrapper.find('[data-test="run-button"]').trigger('click');
    expect(wrapper.emitted()).toHaveProperty('execute');
  });
});
```

## Feature Development

### Development Workflow

1. **Create Feature Branch**:
```bash
git checkout -b feature/query-history
```

2. **Follow TDD Process**:
   - Write failing tests
   - Implement feature
   - Refactor code
   - Update documentation

3. **Code Review Process**:
   - Create pull request
   - Automated checks pass
   - Peer review
   - Merge to main

### Feature Structure

Use the provided script to create features:
```bash
pnpm create-feature query-history
```

This creates:
```
specs/002-query-history/
├── spec.md
├── plan.md
├── tasks.md
├── data-model.md
├── research.md
└── contracts/
```

### Component Development

1. **Create Component**:
```vue
<!-- src/components/QueryHistory.vue -->
<template>
  <div class="query-history">
    <h3>Query History</h3>
    <ul>
      <li v-for="query in queries" :key="query.id">
        {{ query.name || query.sql }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Query } from '../models/Query';

interface Props {
  queries: Query[];
}

const props = defineProps<Props>();

const sortedQueries = computed(() => 
  [...props.queries].sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  )
);
</script>
```

2. **Add Component Tests**:
```typescript
// src/components/__tests__/QueryHistory.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import QueryHistory from '../QueryHistory.vue';
import Query from '../../models/Query';

describe('QueryHistory', () => {
  it('displays query list', () => {
    const queries = [
      new Query({ id: '1', sql: 'SELECT 1' }),
      new Query({ id: '2', sql: 'SELECT 2' })
    ];
    
    const wrapper = mount(QueryHistory, { props: { queries } });
    expect(wrapper.findAll('li')).toHaveLength(2);
  });
});
```

3. **Export Component**:
```typescript
// src/components/index.ts
export { default as QueryHistory } from './QueryHistory.vue';
```

## Debugging

### Development Tools

1. **Vue DevTools**:
   - Install browser extension
   - Inspect component state
   - Monitor events and performance

2. **Browser DevTools**:
   - Network tab for API calls
   - Console for error logging
   - Performance tab for profiling

3. **VS Code Debugging**:
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Chrome",
      "type": "pwa-chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### Common Issues

1. **TypeScript Errors**:
```bash
# Check types
pnpm type-check

# Fix common issues
pnpm lint:fix
```

2. **Test Failures**:
```bash
# Run specific test file
npx vitest run src/models/__tests__/Query.test.ts

# Run tests in watch mode
npx vitest --watch
```

3. **Build Issues**:
```bash
# Clear cache and rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

### Logging

Use structured logging:
```typescript
const logger = {
  info: (message: string, data?: object) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
  },
  debug: (message: string, data?: object) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
};
```

## Performance Guidelines

### Optimization Strategies

1. **Component Performance**:
```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue';

// Use shallowRef for large objects
const queryResults = shallowRef<QueryResult[]>([]);

// Memoize expensive computations
const filteredResults = computed(() => 
  queryResults.value.filter(result => result.status === 'completed')
);
</script>
```

2. **Bundle Size**:
```typescript
// Lazy load heavy components
const Monaco = defineAsyncComponent(() => import('./Monaco.vue'));

// Use dynamic imports for utilities
const { formatSQL } = await import('./utils/formatting');
```

3. **Memory Management**:
```typescript
// Clean up subscriptions
onBeforeUnmount(() => {
  eventBus.off('query-complete', handleQueryComplete);
});

// Clear large objects
onBeforeUnmount(() => {
  queryCache.clear();
});
```

### Performance Monitoring

1. **Bundle Analysis**:
```bash
pnpm build
npx vite-bundle-analyzer dist
```

2. **Runtime Performance**:
```typescript
// Performance timing
const start = performance.now();
await executeQuery(query);
const duration = performance.now() - start;
console.log(`Query executed in ${duration}ms`);
```

3. **Memory Usage**:
```typescript
// Monitor memory usage
if (import.meta.env.DEV) {
  setInterval(() => {
    console.log('Memory usage:', performance.memory);
  }, 30000);
}
```

### Best Practices

1. **Avoid reactive overhead** for static data
2. **Use v-memo** for expensive list rendering
3. **Implement virtual scrolling** for large datasets
4. **Debounce user input** to reduce API calls
5. **Cache query results** appropriately
6. **Lazy load non-critical features**

## Contribution Guidelines

### Before Contributing

1. Read this developer guide
2. Set up development environment
3. Run all tests to ensure working setup
4. Check existing issues and PRs

### Pull Request Process

1. **Create Feature Branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**:
   - Follow code standards
   - Add tests for new functionality
   - Update documentation

3. **Test Changes**:
```bash
pnpm test
pnpm type-check
pnpm lint
```

4. **Commit Changes**:
```bash
git commit -m "feat: add query history functionality"
```

5. **Push and Create PR**:
```bash
git push origin feature/your-feature-name
# Create PR through GitHub interface
```

### Commit Conventions

Use [Conventional Commits](https://conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Build process or auxiliary tool changes

### Code Review Checklist

- [ ] Code follows TypeScript and Vue standards
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Accessibility considerations addressed
- [ ] Cross-browser compatibility checked

## Support and Resources

### Getting Help

1. **GitHub Issues**: Report bugs and request features
2. **Discussions**: Ask questions and share ideas
3. **Documentation**: Check all `.md` files in the project
4. **Code Comments**: In-line documentation for complex logic

### External Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [BigQuery API Documentation](https://cloud.google.com/bigquery/docs/reference/rest)

### Team Communication

- Use GitHub issues for bug reports
- Use GitHub discussions for questions
- Follow the project's code of conduct
- Be respectful and constructive in feedback
