# Research for Query Execution UI (Vue 3 + TypeScript + Tailwind + shadcn)

## Unknowns and Research Tasks

### 1. Best Practices for Vue 3 + TypeScript + Tailwind + shadcn
- Decision: Use Vue 3 with the Composition API, TypeScript for type safety, Tailwind CSS for utility-first styling, and shadcn for accessible UI components if needed.
- Rationale: This stack is modern, performant, and well-supported. Tailwind and shadcn enable rapid, accessible UI development. TypeScript improves maintainability.
- Alternatives considered: Vuetify (heavier, less flexible), Quasar (more opinionated), plain CSS (slower dev).

### 2. SQL Editor Integration
- Decision: Use Monaco Editor (the editor behind VSCode) for SQL editing, autocomplete, and formatting.
- Rationale: Monaco provides a familiar, high-performance code editing experience and is highly customizable.
- Alternatives considered: CodeMirror (lighter, but less VSCode-like), Ace Editor (older, less maintained).

### 3. BigQuery Authentication (OAuth)
- Decision: Use Google OAuth 2.0 for authentication, with PKCE flow for SPA security.
- Rationale: PKCE is recommended for SPAs. Google provides libraries for OAuth integration.
- Alternatives considered: Service accounts (not suitable for end-user auth), Implicit flow (less secure).

### 4. Query Execution and Result Handling
- Decision: Use REST API calls to BigQuery via Google APIs client libraries.
- Rationale: Official libraries are robust and well-documented. REST API is required for browser-based apps.
- Alternatives considered: Direct gRPC (not supported in browser), custom backend proxy (adds complexity).

### 5. Performance and Memory Optimization
- Decision: Use virtualized tables for large result sets, lazy-load panels, and minimize dependencies.
- Rationale: Virtualization prevents memory bloat. Lazy loading improves initial load time.
- Alternatives considered: Render all rows (unscalable), heavy state management (unnecessary for MVP).

### 6. Keyboard Navigation and Accessibility
- Decision: Use shadcn and Headless UI for accessible, keyboard-navigable components. Implement custom shortcuts for panel toggling and query execution.
- Rationale: Accessibility is a core requirement. shadcn and Headless UI are designed for this.
- Alternatives considered: Custom components (slower, more error-prone).

### 7. Dark Mode
- Decision: Use Tailwind's dark mode support and persist user preference in local storage.
- Rationale: Tailwind makes dark mode easy to implement and maintain.
- Alternatives considered: Custom CSS (more work, less maintainable).

## All major unknowns resolved for MVP.
