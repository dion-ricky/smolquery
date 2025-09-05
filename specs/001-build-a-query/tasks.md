# Tasks: Query Execution User Interface for BigQuery

**Input**: Design documents from `/specs/001-build-a-query/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Setup project structure and dependencies
2. Write contract and integration tests (TDD)
3. Implement core models and services
4. Implement API endpoint and UI features
5. Integrate authentication, editor, and panels
6. Polish: unit tests, performance, docs
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 3.1: Setup
- [x] T001 Create Vite+Vue 3+TS project structure in root directory per plan.md
- [x] T002 Initialize dependencies: Vue 3, TypeScript, Tailwind CSS, Monaco Editor, Vite in root directory
- [x] T003 [P] Configure linting and formatting tools (e.g., ESLint, Prettier)
- [x] T003a [P] Configure VS Code workspace settings in `.vscode/settings.json` to enforce consistent linting and formatting across all developers

## Phase 3.2: Tests First (TDD)
- [x] T004 [P] Contract test for POST /api/query/execute in `specs/001-build-a-query/contracts/query.contract.test.ts`
- [x] T005 [P] Integration test for query execution and result display in `specs/001-build-a-query/contracts/query.contract.test.ts`
- [x] T006 [P] Integration test for authentication flow in `specs/001-build-a-query/contracts/query.contract.test.ts`
- [x] T007 [P] Integration test for keyboard navigation and panel toggling in `specs/001-build-a-query/contracts/query.contract.test.ts`

## Phase 3.3: Core Implementation
- [x] T008 [P] Implement Query model in `src/models/Query.ts`
- [x] T009 [P] Implement UserSession model in `src/models/UserSession.ts`
- [x] T010 [P] Implement Panel model in `src/models/Panel.ts`
- [x] T011 Implement Query execution service in `src/services/queryService.ts`
- [x] T012 Implement authentication service in `src/services/authService.ts`
- [x] T013 Implement API endpoint POST /api/query/execute in `src/api/query.ts`

## Phase 3.4: UI Implementation
- [x] T014 Implement Monaco SQL editor in `src/components/QueryEditor.vue`
- [x] T015 Implement results panel in `src/components/ResultsPanel.vue`
- [x] T016 Implement schema browser panel in `src/components/SchemaPanel.vue`
- [x] T017 Implement settings panel in `src/components/SettingsPanel.vue`
- [x] T018 Implement keyboard shortcuts and panel toggling in `src/components/PanelManager.vue`
- [x] T019 Implement dark mode toggle in `src/components/ThemeToggle.vue`

## Phase 3.5: Integration & Polish
- [x] T020 Integrate Google OAuth in `src/services/authService.ts`
- [x] T021 Integrate query execution with BigQuery API in `src/services/queryService.ts`
- [x] T022 [P] Add unit tests for all models and services in `tests/`
- [x] T023 [P] Add performance tests for query execution in `tests/performance/`
- [x] T024 [P] Add documentation in `README.md` and `specs/001-build-a-query/`

---

## Parallel Execution Guidance
- Tasks marked [P] can be run in parallel (e.g., T003, T004-T007, T008-T010, T022-T024)
- Example: To run all contract and integration tests in parallel:
  ```sh
  pnpm vitest run --dir ./specs/001-build-a-query/contracts
  ```
- Example: To implement models in parallel:
  Assign T008, T009, T010 to separate agents

## Dependency Notes
- Setup (T001-T003) must complete before tests and implementation
- Contract/integration tests (T004-T007) must be written before core implementation (T008+)
- Models (T008-T010) before services (T011-T012)
- Services before API endpoint (T013)
- Core before UI (T014+)
- All before integration/polish (T020+)
