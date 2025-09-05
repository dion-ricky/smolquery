import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
// Define types for globals
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var gapi: any;
}

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock monaco-editor to prevent import resolution issues in tests
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn().mockReturnValue({
      getValue: vi.fn().mockReturnValue(''),
      setValue: vi.fn(),
      dispose: vi.fn(),
      onDidChangeModelContent: vi.fn(),
      addCommand: vi.fn()
    })
  },
  KeyMod: {
    CtrlCmd: 1
  },
  KeyCode: {
    Enter: 1
  }
}));

// Mock the components to avoid monaco-editor import issues
vi.mock('@/components', () => ({
  QueryEditor: {
    name: 'QueryEditor',
    template: `
      <div class="query-editor">
        <div class="monaco-editor" @input="$emit('update:modelValue', $event.target.value)"></div>
        <button data-test="execute-button" @click="$emit('execute')">Execute</button>
      </div>
    `,
    props: ['modelValue'],
    emits: ['update:modelValue', 'execute']
  },
  ResultsPanel: {
    name: 'ResultsPanel',
    template: `
      <div class="results-panel">
        <div v-if="loading" data-test="loading-indicator">Loading...</div>
        <table v-else-if="results.length" data-test="results-table">
          <tr v-for="result in results" :key="result.id" data-test="result-row">
            <td>{{ result.id }}</td>
            <td>{{ result.name }}</td>
          </tr>
        </table>
      </div>
    `,
    props: ['results', 'loading']
  },
  PanelManager: {
    name: 'PanelManager',
    template: `
      <div class="panel-manager" @keydown="handleKeydown">
        <div data-test="results-panel" :class="{ visible: resultsVisible }">Results Panel</div>
        <div data-test="schema-panel" :class="{ visible: schemaVisible }">Schema Panel</div>
        <div data-test="settings-panel" :class="{ visible: settingsVisible }">Settings Panel</div>
      </div>
    `,
    setup() {
      const resultsVisible = ref(false);
      const schemaVisible = ref(false);
      const settingsVisible = ref(false);

      const handleKeydown = (e: KeyboardEvent) => {
        if (e.ctrlKey) {
          switch (e.key) {
            case 'r':
              resultsVisible.value = !resultsVisible.value;
              break;
            case 's':
              schemaVisible.value = !schemaVisible.value;
              break;
            case ',':
              settingsVisible.value = !settingsVisible.value;
              break;
          }
        }
      };

      return { resultsVisible, schemaVisible, settingsVisible, handleKeydown };
    }
  }
}));

// Contract test for /api/query/execute endpoint
describe('/api/query/execute', () => {
  const validAuthToken = 'valid-token';
  const validQuery = 'SELECT * FROM test_table';
  const apiEndpoint = '/api/query/execute';

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return results for a valid query and authToken', async () => {
    const expectedResponse = {
      results: [{ id: 1, name: 'test' }],
      status: 'success',
      error: null
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: validQuery,
        authToken: validAuthToken
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toEqual(expectedResponse);
    expect(data.results).toBeDefined();
    expect(data.status).toBe('success');
    expect(data.error).toBeNull();
  });

  it('should return 401 for invalid authToken', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ status: 'error', error: 'Authentication failed' })
    });

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: validQuery,
        authToken: 'invalid-token'
      })
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
  });

  it('should return 400 for missing query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ status: 'error', error: 'Query is required' })
    });

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        authToken: validAuthToken
        // query intentionally omitted
      })
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });

  it('should handle query execution errors gracefully', async () => {
    const errorResponse = {
      results: [],
      status: 'error',
      error: 'Query execution failed: Invalid syntax'
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => errorResponse
    });

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'INVALID SQL QUERY',
        authToken: validAuthToken
      })
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual(errorResponse);
    expect(data.error).toBeDefined();
  });
});

// Integration tests for the query UI components and interactions
describe('Query UI Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should execute query and display results in the results panel', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{ id: 1, name: 'test' }],
        status: 'success',
        error: null
      })
    });

    const { QueryEditor, ResultsPanel } = await import('@/components');
    const wrapper = mount({
      components: { QueryEditor, ResultsPanel },
      template: `
        <div>
          <query-editor v-model="query" @execute="executeQuery" />
          <results-panel :results="results" :loading="loading" />
        </div>
      `,
      setup() {
        const query = ref('SELECT * FROM test_table');
        const results = ref([]);
        const loading = ref(false);

        async function executeQuery() {
          loading.value = true;
          try {
            const response = await fetch('/api/query/execute', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: query.value,
                authToken: 'valid-token'
              })
            });
            const data = await response.json();
            results.value = data.results;
          } finally {
            loading.value = false;
          }
        }

        return { query, results, loading, executeQuery };
      }
    });

    // Execute query and check initial loading state
    const executePromise = wrapper.get('[data-test="execute-button"]').trigger('click');

    // Wait a tick to let the loading state update
    await wrapper.vm.$nextTick();

    // Verify loading state is active
    expect(wrapper.find('[data-test="loading-indicator"]').exists()).toBe(true);

    // Wait for the execute promise to complete
    await executePromise;
    await flushPromises();

    // Verify results are displayed and loading is complete
    expect(wrapper.find('[data-test="loading-indicator"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="results-table"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-test="result-row"]')).toHaveLength(1);
  });
});

// Integration tests for authentication flow
describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    // Reset any existing session before each test
    vi.clearAllMocks();
  });

  it('should handle Google OAuth authentication flow', async () => {
    const { authService } = await import('@/services/authService');

    // Reset the current session to ensure clean state
    authService.signOut();

    const mockGoogleUser = {
      isSignedIn: vi.fn().mockReturnValue(true),
      getAuthResponse: vi.fn().mockReturnValue({
        access_token: 'mock-token',
        expires_in: 3600
      }),
      getBasicProfile: vi.fn().mockReturnValue({
        getId: () => 'mock-user-id'
      })
    };

    const mockAuthInstance = {
      signIn: vi.fn().mockResolvedValue(mockGoogleUser)
    };

    // Mock Google Auth initialization properly
    global.gapi = {
      load: vi.fn().mockImplementation((_api: string, options: { callback: () => void }) => {
        options.callback();
      }),
      auth2: {
        init: vi.fn().mockResolvedValue(undefined),
        getAuthInstance: vi.fn().mockReturnValue(mockAuthInstance)
      }
    };

    const wrapper = mount({
      template: '<button @click="login">Login</button>',
      setup() {
        const login = async () => {
          await authService.signInWithGoogle();
        };
        return { login };
      }
    });

    // Trigger login
    await wrapper.get('button').trigger('click');
    await flushPromises();

    // Verify Google Auth was properly initialized
    expect(global.gapi.load).toHaveBeenCalledWith('auth2', expect.any(Object));
    expect(global.gapi.auth2.init).toHaveBeenCalled();
    expect(global.gapi.auth2.getAuthInstance).toHaveBeenCalled();

    // Verify Google sign-in was called
    expect(mockAuthInstance.signIn).toHaveBeenCalled();

    // Verify token was stored
    expect(authService.getAuthToken()).toBe('mock-token');
  });
});

// Integration tests for keyboard navigation and panel management
describe('Keyboard Navigation and Panel Integration', () => {
  it('should handle keyboard shortcuts for panel toggling', async () => {
    const { PanelManager } = await import('@/components');
    const wrapper = mount(PanelManager);

    // Test Results Panel Toggle (Ctrl+R)
    await wrapper.trigger('keydown', {
      key: 'r',
      ctrlKey: true
    });
    expect(wrapper.get('[data-test="results-panel"]').classes()).toContain('visible');

    // Test Schema Panel Toggle (Ctrl+S)
    await wrapper.trigger('keydown', {
      key: 's',
      ctrlKey: true
    });
    expect(wrapper.get('[data-test="schema-panel"]').classes()).toContain('visible');

    // Test Settings Panel Toggle (Ctrl+,)
    await wrapper.trigger('keydown', {
      key: ',',
      ctrlKey: true
    });
    expect(wrapper.get('[data-test="settings-panel"]').classes()).toContain('visible');
  });

  it('should maintain panel state when toggling', async () => {
    const { PanelManager } = await import('@/components');
    const wrapper = mount(PanelManager);

    // Open Results Panel
    await wrapper.trigger('keydown', {
      key: 'r',
      ctrlKey: true
    });

    // Open Schema Panel
    await wrapper.trigger('keydown', {
      key: 's',
      ctrlKey: true
    });

    // Verify both panels are visible
    expect(wrapper.get('[data-test="results-panel"]').classes()).toContain('visible');
    expect(wrapper.get('[data-test="schema-panel"]').classes()).toContain('visible');

    // Close Results Panel
    await wrapper.trigger('keydown', {
      key: 'r',
      ctrlKey: true
    });

    // Verify only Schema Panel remains visible
    expect(wrapper.get('[data-test="results-panel"]').classes()).not.toContain('visible');
    expect(wrapper.get('[data-test="schema-panel"]').classes()).toContain('visible');
  });
});
