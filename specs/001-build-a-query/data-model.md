# Data Model: Query Execution UI

## Entities

### Query
- text: string
- status: 'idle' | 'running' | 'success' | 'error'
- results: array | null
- error: string | null

### UserSession
- userId: string
- theme: 'light' | 'dark'
- keyboardShortcuts: object
- authToken: string

### Panel
- id: string
- type: 'schema' | 'results' | 'settings'
- visible: boolean

## Relationships
- UserSession manages preferences and authentication for the current user.
- Query is created and executed by UserSession.
- Panel visibility and state are controlled by UserSession preferences.
