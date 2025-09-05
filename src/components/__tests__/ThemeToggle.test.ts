import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ThemeToggle from '../ThemeToggle.vue'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    // Reset document classes
    document.documentElement.classList.remove('dark')
  })

  describe('Component Structure', () => {
    it('renders correctly with default props', () => {
      const wrapper = mount(ThemeToggle)
      expect(wrapper.find('[data-test="theme-toggle"]').exists()).toBe(true)
      expect(wrapper.find('.theme-icon').exists()).toBe(true)
      expect(wrapper.find('.theme-label').exists()).toBe(true)
    })

    it('shows moon icon and "Dark" label in light mode', () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: false }
      })

      const label = wrapper.find('.theme-label')
      expect(label.text()).toBe('Dark')

      // Check for moon icon (dark mode icon)
      const svg = wrapper.find('.theme-icon svg')
      expect(svg.exists()).toBe(true)
      expect(svg.find('path').exists()).toBe(true) // Moon icon has path element
    })

    it('shows sun icon and "Light" label in dark mode', () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: true }
      })

      const label = wrapper.find('.theme-label')
      expect(label.text()).toBe('Light')

      // Check for sun icon (light mode icon)
      const svg = wrapper.find('.theme-icon svg')
      expect(svg.exists()).toBe(true)
      expect(svg.find('circle').exists()).toBe(true) // Sun icon has circle element
    })
  })

  describe('Theme Toggle Functionality', () => {
    it('emits update:modelValue when clicked', async () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: false }
      })

      const button = wrapper.find('[data-test="theme-toggle"]')
      await button.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it('toggles from light to dark mode', async () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: false }
      })

      const button = wrapper.find('[data-test="theme-toggle"]')
      await button.trigger('click')

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it('toggles from dark to light mode', async () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: true }
      })

      const button = wrapper.find('[data-test="theme-toggle"]')
      await button.trigger('click')

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    })
  })

  describe('CSS Classes and Styling', () => {
    it('applies correct CSS classes for light mode', () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: false }
      })

      const button = wrapper.find('[data-test="theme-toggle"]')
      expect(button.classes()).toContain('theme-toggle--light')
      expect(button.classes()).not.toContain('theme-toggle--dark')
    })

    it('applies correct CSS classes for dark mode', () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: true }
      })

      const button = wrapper.find('[data-test="theme-toggle"]')
      expect(button.classes()).toContain('theme-toggle--dark')
      expect(button.classes()).not.toContain('theme-toggle--light')
    })
  })

  describe('DOM Integration', () => {
    it('adds dark class to document.documentElement when dark mode is enabled', async () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: false }
      })

      // Change to dark mode
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('removes dark class from document.documentElement when light mode is enabled', async () => {
      // Start with dark mode
      document.documentElement.classList.add('dark')

      const wrapper = mount(ThemeToggle, {
        props: { modelValue: true }
      })

      // Change to light mode
      await wrapper.setProps({ modelValue: false })
      await wrapper.vm.$nextTick()

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('LocalStorage Integration', () => {
    it('saves theme preference to localStorage when changed to dark', async () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: false }
      })

      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('saves theme preference to localStorage when changed to light', async () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: true }
      })

      await wrapper.setProps({ modelValue: false })
      await wrapper.vm.$nextTick()

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
    })

    it('loads stored preference on mount', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      const wrapper = mount(ThemeToggle, {
        props: { modelValue: false }
      })

      // The component should emit an update to match stored preference
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it('uses system preference when no stored preference exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      // Mock system preference for dark mode
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const wrapper = mount(ThemeToggle, {
        props: { modelValue: false }
      })

      // Should emit update to match system preference
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })
  })

  describe('Accessibility', () => {
    it('has correct title attributes', () => {
      const lightWrapper = mount(ThemeToggle, {
        props: { modelValue: false }
      })

      const darkWrapper = mount(ThemeToggle, {
        props: { modelValue: true }
      })

      expect(lightWrapper.find('[data-test="theme-toggle"]').attributes('title')).toBe('Switch to dark mode')
      expect(darkWrapper.find('[data-test="theme-toggle"]').attributes('title')).toBe('Switch to light mode')
    })

    it('has correct button type', () => {
      const wrapper = mount(ThemeToggle)
      const button = wrapper.find('[data-test="theme-toggle"]')
      expect(button.attributes('type')).toBe('button')
    })

    it('is keyboard accessible', async () => {
      const wrapper = mount(ThemeToggle, {
        props: { modelValue: false }
      })

      const button = wrapper.find('[data-test="theme-toggle"]')
      await button.trigger('keydown.enter')

      // Button should still work with keyboard
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('Component Lifecycle', () => {
    it('applies initial theme to document on mount', () => {
      mount(ThemeToggle, {
        props: { modelValue: true }
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('does not break when localStorage is not available', () => {
      const originalGetItem = localStorageMock.getItem
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      expect(() => {
        mount(ThemeToggle, {
          props: { modelValue: false }
        })
      }).not.toThrow()

      localStorageMock.getItem.mockImplementation(originalGetItem)
    })
  })
})
