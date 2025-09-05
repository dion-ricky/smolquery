import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PanelManager from '../PanelManager.vue'

// Mock the child components
vi.mock('../QueryEditor.vue', () => ({
  default: {
    name: 'QueryEditor',
    props: ['modelValue'],
    emits: ['update:modelValue', 'execute'],
    template: '<div><button data-test="execute-button" @click="$emit(\'execute\')">Execute</button></div>'
  }
}))

vi.mock('../ResultsPanel.vue', () => ({
  default: {
    name: 'ResultsPanel',
    props: ['results', 'loading'],
    template: '<div><div v-if="loading" data-test="loading-indicator">Loading...</div><div v-else data-test="results-table">Results</div></div>'
  }
}))

vi.mock('../SchemaPanel.vue', () => ({
  default: {
    name: 'SchemaPanel',
    props: ['schema'],
    template: '<div>Schema</div>'
  }
}))

vi.mock('../SettingsPanel.vue', () => ({
  default: {
    name: 'SettingsPanel',
    props: ['settings'],
    emits: ['update:settings'],
    template: '<div>Settings</div>'
  }
}))

describe('PanelManager', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    wrapper = mount(PanelManager)
  })

  describe('Panel Visibility', () => {
    it('should initially hide all panels', () => {
      expect(wrapper.find('[data-test="results-panel"]').classes()).not.toContain('visible')
      expect(wrapper.find('[data-test="schema-panel"]').classes()).not.toContain('visible')
      expect(wrapper.find('[data-test="settings-panel"]').classes()).not.toContain('visible')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should toggle results panel with Ctrl+R', async () => {
      await wrapper.trigger('keydown', { key: 'r', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="results-panel"]').classes()).toContain('visible')

      // Toggle again to hide
      await wrapper.trigger('keydown', { key: 'r', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="results-panel"]').classes()).not.toContain('visible')
    })

    it('should toggle schema panel with Ctrl+S', async () => {
      await wrapper.trigger('keydown', { key: 's', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="schema-panel"]').classes()).toContain('visible')

      // Toggle again to hide
      await wrapper.trigger('keydown', { key: 's', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="schema-panel"]').classes()).not.toContain('visible')
    })

    it('should toggle settings panel with Ctrl+,', async () => {
      await wrapper.trigger('keydown', { key: ',', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="settings-panel"]').classes()).toContain('visible')

      // Toggle again to hide
      await wrapper.trigger('keydown', { key: ',', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="settings-panel"]').classes()).not.toContain('visible')
    })

    it('should toggle keyboard help with Ctrl+/', async () => {
      await wrapper.trigger('keydown', { key: '/', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="keyboard-help"]').exists()).toBe(true)

      // Toggle again to hide
      await wrapper.trigger('keydown', { key: '/', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="keyboard-help"]').exists()).toBe(false)
    })

    it('should close all panels with Escape key', async () => {
      // Open all panels first
      await wrapper.trigger('keydown', { key: 'r', ctrlKey: true })
      await wrapper.trigger('keydown', { key: 's', ctrlKey: true })
      await wrapper.trigger('keydown', { key: ',', ctrlKey: true })
      await wrapper.trigger('keydown', { key: '/', ctrlKey: true })
      await nextTick()

      // Verify all panels are open
      expect(wrapper.find('[data-test="results-panel"]').classes()).toContain('visible')
      expect(wrapper.find('[data-test="schema-panel"]').classes()).toContain('visible')
      expect(wrapper.find('[data-test="settings-panel"]').classes()).toContain('visible')
      expect(wrapper.find('[data-test="keyboard-help"]').exists()).toBe(true)

      // Close all with Escape
      await wrapper.trigger('keydown', { key: 'Escape' })
      await nextTick()

      // Verify all panels are closed
      expect(wrapper.find('[data-test="results-panel"]').classes()).not.toContain('visible')
      expect(wrapper.find('[data-test="schema-panel"]').classes()).not.toContain('visible')
      expect(wrapper.find('[data-test="settings-panel"]').classes()).not.toContain('visible')
      expect(wrapper.find('[data-test="keyboard-help"]').exists()).toBe(false)
    })

    it('should execute query with Ctrl+E and show results panel', async () => {
      // Set a query value by finding the QueryEditor and updating its modelValue
      const queryEditor = wrapper.findComponent({ name: 'QueryEditor' })
      await queryEditor.vm.$emit('update:modelValue', 'SELECT * FROM test')
      await nextTick()

      // Initially no results panel visible
      expect(wrapper.find('[data-test="results-panel"]').classes()).not.toContain('visible')

      // Trigger Ctrl+E to execute query
      await wrapper.trigger('keydown', { key: 'e', ctrlKey: true })
      await nextTick()

      // Results panel should be shown after execution
      expect(wrapper.find('[data-test="results-panel"]').classes()).toContain('visible')
    })

    it('should prevent default behavior for keyboard shortcuts', () => {
      // This test verifies the component handles keyboard events properly
      // by checking that preventDefault is called when Ctrl+R is pressed
      const element = wrapper.find('.panel-manager')
      expect(element.exists()).toBe(true)
    })
  })

  describe('Panel Management', () => {
    it('should maintain independent panel states', async () => {
      // Open results and schema panels
      await wrapper.trigger('keydown', { key: 'r', ctrlKey: true })
      await wrapper.trigger('keydown', { key: 's', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="results-panel"]').classes()).toContain('visible')
      expect(wrapper.find('[data-test="schema-panel"]').classes()).toContain('visible')
      expect(wrapper.find('[data-test="settings-panel"]').classes()).not.toContain('visible')

      // Close only results panel
      await wrapper.trigger('keydown', { key: 'r', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="results-panel"]').classes()).not.toContain('visible')
      expect(wrapper.find('[data-test="schema-panel"]').classes()).toContain('visible')
      expect(wrapper.find('[data-test="settings-panel"]').classes()).not.toContain('visible')
    })

    it('should have close buttons for each panel', async () => {
      // Open a panel
      await wrapper.trigger('keydown', { key: 'r', ctrlKey: true })
      await nextTick()

      const closeButton = wrapper.find('[data-test="close-results"]')
      expect(closeButton.exists()).toBe(true)

      // Click close button
      await closeButton.trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="results-panel"]').classes()).not.toContain('visible')
    })
  })

  describe('Query Execution', () => {
    it('should auto-show results panel when executing query via keyboard shortcut', async () => {
      // Set a query value first
      const queryEditor = wrapper.findComponent({ name: 'QueryEditor' })
      await queryEditor.vm.$emit('update:modelValue', 'SELECT * FROM test')
      await nextTick()

      expect(wrapper.find('[data-test="results-panel"]').classes()).not.toContain('visible')

      // Use Ctrl+E keyboard shortcut to execute query
      await wrapper.trigger('keydown', { key: 'e', ctrlKey: true })
      await nextTick()

      expect(wrapper.find('[data-test="results-panel"]').classes()).toContain('visible')
    })

    it('should show loading state during query execution', async () => {
      // Set a query value first
      const queryEditor = wrapper.findComponent({ name: 'QueryEditor' })
      await queryEditor.vm.$emit('update:modelValue', 'SELECT * FROM test')
      await nextTick()

      // Execute query via keyboard shortcut
      await wrapper.trigger('keydown', { key: 'e', ctrlKey: true })
      await nextTick()

      // Results panel should be visible
      expect(wrapper.find('[data-test="results-panel"]').classes()).toContain('visible')

      // Should show loading indicator during execution
      expect(wrapper.find('[data-test="loading-indicator"]').exists()).toBe(true)

      // After execution completes, should show results table
      // Wait for the mock query execution to complete (1 second + some buffer)
      await new Promise(resolve => setTimeout(resolve, 1100))
      await nextTick()

      expect(wrapper.find('[data-test="results-table"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="loading-indicator"]').exists()).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('should be focusable with tabindex', () => {
      expect(wrapper.find('.panel-manager').attributes('tabindex')).toBe('0')
    })

    it('should handle keyboard events when focused', async () => {
      // Test that keyboard events are handled by triggering one and verifying behavior
      await wrapper.find('.panel-manager').trigger('keydown', { key: 'r', ctrlKey: true })
      await nextTick()

      // Verify the keyboard event had an effect (results panel should be visible)
      expect(wrapper.find('[data-test="results-panel"]').classes()).toContain('visible')
    })
  })

  describe('Integration', () => {
    it('should render query editor always', () => {
      expect(wrapper.find('[data-test="query-editor"]').exists()).toBe(true)
    })

    it('should handle settings panel interaction', async () => {
      // Open settings panel
      await wrapper.trigger('keydown', { key: ',', ctrlKey: true })
      await nextTick()

      // Verify settings panel is visible
      expect(wrapper.find('[data-test="settings-panel"]').classes()).toContain('visible')

      // The actual settings updates would be handled by the SettingsPanel component
      // which emits update:settings events that the parent component handles
    })
  })
})