<template>
  <div class="panel-manager" tabindex="0" @keydown="onKeydown">
    <!-- Header with Theme Toggle -->
    <div class="header">
      <div class="header-content">
        <h1>SmolQuery</h1>
        <ThemeToggle v-model="settings.darkMode" />
      </div>
    </div>

    <!-- Query Editor - always visible -->
    <div class="main-editor">
      <QueryEditor v-model="query" @execute="handleExecuteQuery" data-test="query-editor" />
    </div>

    <!-- Panels Container -->
    <div class="panels-container">
      <!-- Results Panel -->
      <div :class="['panel', 'results-panel', { visible: showResults }]" data-test="results-panel">
        <div class="panel-header">
          <h3>Results</h3>
          <button @click="toggleResults" class="close-btn" data-test="close-results">×</button>
        </div>
        <div class="panel-content">
          <ResultsPanel :results="queryResults" :loading="isExecutingQuery" />
        </div>
      </div>

      <!-- Schema Panel -->
      <div :class="['panel', 'schema-panel', { visible: showSchema }]" data-test="schema-panel">
        <div class="panel-header">
          <h3>Schema</h3>
          <button @click="toggleSchema" class="close-btn" data-test="close-schema">×</button>
        </div>
        <div class="panel-content">
          <SchemaPanel :schema="schema" />
        </div>
      </div>

      <!-- Settings Panel -->
      <div :class="['panel', 'settings-panel', { visible: showSettings }]" data-test="settings-panel">
        <div class="panel-header">
          <h3>Settings</h3>
          <button @click="toggleSettings" class="close-btn" data-test="close-settings">×</button>
        </div>
        <div class="panel-content">
          <SettingsPanel :settings="settings" @update:settings="updateSettings" />
        </div>
      </div>
    </div>

    <!-- Keyboard Shortcuts Help -->
    <div v-if="showKeyboardHelp" class="keyboard-help" data-test="keyboard-help">
      <div class="help-content">
        <h4>Keyboard Shortcuts</h4>
        <ul>
          <li><kbd>Ctrl+R</kbd> - Toggle Results Panel</li>
          <li><kbd>Ctrl+S</kbd> - Toggle Schema Panel</li>
          <li><kbd>Ctrl+,</kbd> - Toggle Settings Panel</li>
          <li><kbd>Ctrl+E</kbd> - Execute Query</li>
          <li><kbd>Ctrl+/</kbd> - Toggle this help</li>
          <li><kbd>Esc</kbd> - Close all panels</li>
        </ul>
        <button @click="showKeyboardHelp = false">Close</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from 'vue'
import { QueryEditor, ResultsPanel, SchemaPanel, SettingsPanel, ThemeToggle } from './index'

export default defineComponent({
  name: 'PanelManager',
  components: {
    QueryEditor,
    ResultsPanel,
    SchemaPanel,
    SettingsPanel,
    ThemeToggle
  },
  setup() {
    // Panel visibility state
    const showResults = ref(false)
    const showSchema = ref(false)
    const showSettings = ref(false)
    const showKeyboardHelp = ref(false)

    // Data state
    const query = ref('')
    const queryResults = ref<Array<{ id: number; name: string }>>([])
    const isExecutingQuery = ref(false)
    const schema = ref<Array<{ name: string; fields: Array<{ name: string; type: string }> }>>([])
    const settings = reactive({
      darkMode: false,
      pageSize: 10
    })

    // Panel toggle functions
    const toggleResults = () => { showResults.value = !showResults.value }
    const toggleSchema = () => { showSchema.value = !showSchema.value }
    const toggleSettings = () => { showSettings.value = !showSettings.value }
    const toggleKeyboardHelp = () => { showKeyboardHelp.value = !showKeyboardHelp.value }

    // Close all panels
    const closeAllPanels = () => {
      showResults.value = false
      showSchema.value = false
      showSettings.value = false
      showKeyboardHelp.value = false
    }

    // Keyboard event handler
    function onKeydown(e: KeyboardEvent) {
      // Prevent default for our shortcuts
      if (e.ctrlKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault()
            toggleResults()
            break
          case 's':
            e.preventDefault()
            toggleSchema()
            break
          case ',':
            e.preventDefault()
            toggleSettings()
            break
          case 'e':
            e.preventDefault()
            handleExecuteQuery()
            break
          case '/':
            e.preventDefault()
            toggleKeyboardHelp()
            break
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        closeAllPanels()
      }
    }

    // Query execution handler
    async function handleExecuteQuery() {
      if (!query.value.trim()) return

      isExecutingQuery.value = true
      showResults.value = true // Auto-show results panel when executing

      try {
        // Mock query execution - in real app this would call the API
        await new Promise(resolve => setTimeout(resolve, 1000))
        queryResults.value = [
          { id: 1, name: 'Sample Result 1' },
          { id: 2, name: 'Sample Result 2' }
        ]
      } catch (error) {
        console.error('Query execution failed:', error)
        queryResults.value = []
      } finally {
        isExecutingQuery.value = false
      }
    }

    // Settings update handler
    function updateSettings(newSettings: typeof settings) {
      Object.assign(settings, newSettings)
    }

    // Focus management
    onMounted(() => {
      // Auto-focus the panel manager for keyboard navigation
      const element = document.querySelector('.panel-manager') as HTMLElement
      if (element) {
        element.focus()
      }
    })

    return {
      // Panel visibility
      showResults,
      showSchema,
      showSettings,
      showKeyboardHelp,

      // Data
      query,
      queryResults,
      isExecutingQuery,
      schema,
      settings,

      // Methods
      toggleResults,
      toggleSchema,
      toggleSettings,
      toggleKeyboardHelp,
      closeAllPanels,
      onKeydown,
      handleExecuteQuery,
      updateSettings
    }
  }
})
</script>

<style scoped>
.panel-manager {
  display: flex;
  flex-direction: column;
  height: 100vh;
  outline: none;
}

.header {
  border-bottom: 1px solid var(--color-button-border, #e0e0e0);
  background-color: var(--color-background, white);
  padding: 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-foreground);
}

.main-editor {
  flex: 1;
  min-height: 200px;
}

.panels-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.panel {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  min-width: 300px;
  max-width: 500px;
  flex: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: none;
}

.panel.visible {
  display: block;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f5f5;
  border-radius: 8px 8px 0 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #e0e0e0;
}

.panel-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.keyboard-help {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.help-content {
  padding: 24px;
  min-width: 300px;
}

.help-content h4 {
  margin: 0 0 16px 0;
}

.help-content ul {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
}

.help-content li {
  padding: 4px 0;
  display: flex;
  justify-content: space-between;
}

kbd {
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 12px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .panel {
    background: #2d2d2d;
    border-color: #404040;
    color: white;
  }

  .panel-header {
    background: #404040;
    border-color: #505050;
  }

  .close-btn:hover {
    background: #505050;
  }

  .keyboard-help {
    background: #2d2d2d;
    border-color: #404040;
    color: white;
  }

  kbd {
    background: #404040;
    border-color: #505050;
    color: white;
  }
}
</style>
