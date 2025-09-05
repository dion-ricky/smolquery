<template>
  <button @click="toggleTheme" class="theme-toggle-btn" :class="themeClasses"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'" data-test="theme-toggle" type="button">
    <span class="theme-icon">
      <svg v-if="isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <!-- Sun icon for dark mode (click to go to light) -->
        <circle cx="12" cy="12" r="5" />
        <path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <!-- Moon icon for light mode (click to go to dark) -->
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </span>
    <span class="theme-label">{{ isDark ? 'Light' : 'Dark' }}</span>
  </button>
</template>

<script lang="ts">
import { defineComponent, computed, watch, onMounted } from 'vue'

export default defineComponent({
  name: 'ThemeToggle',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isDark = computed(() => props.modelValue)

    const themeClasses = computed(() => ({
      'theme-toggle--dark': isDark.value,
      'theme-toggle--light': !isDark.value
    }))

    // Toggle theme function
    const toggleTheme = () => {
      const newTheme = !isDark.value
      emit('update:modelValue', newTheme)
    }

    // Apply theme to document
    const applyTheme = (dark: boolean) => {
      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // Watch for theme changes and apply to document
    watch(isDark, (newValue) => {
      applyTheme(newValue)
      // Store preference in localStorage with error handling
      try {
        localStorage.setItem('theme', newValue ? 'dark' : 'light')
      } catch (error) {
        // Silently fail if localStorage is not available
        console.warn('Could not save theme preference to localStorage:', error)
      }
    }, { immediate: true })

    // Initialize theme from localStorage on mount
    onMounted(() => {
      let storedTheme: string | null = null

      try {
        storedTheme = localStorage.getItem('theme')
      } catch (error) {
        // Silently fail if localStorage is not available
        console.warn('Could not read theme preference from localStorage:', error)
      }

      let prefersDark = false
      try {
        prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      } catch (error) {
        // Silently fail if matchMedia is not available
        console.warn('Could not detect system theme preference:', error)
      }

      // Use stored preference, otherwise use system preference
      const shouldBeDark = storedTheme ? storedTheme === 'dark' : prefersDark

      if (shouldBeDark !== isDark.value) {
        emit('update:modelValue', shouldBeDark)
      }
    })

    return {
      isDark,
      themeClasses,
      toggleTheme
    }
  }
})
</script>

<style scoped>
.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  background-color: transparent;
  color: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease-in-out;
  cursor: pointer;
  user-select: none;
}

.theme-toggle-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.theme-toggle-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.theme-toggle-btn:active {
  transform: scale(0.98);
}

.theme-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease-in-out;
}

.theme-toggle-btn:hover .theme-icon {
  transform: rotate(15deg);
}

.theme-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Dark mode styles */
.theme-toggle--dark:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.theme-toggle--light:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {

  .theme-toggle-btn,
  .theme-icon {
    transition: none;
  }

  .theme-toggle-btn:hover .theme-icon {
    transform: none;
  }
}
</style>
