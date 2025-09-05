import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsPanel from '../SettingsPanel.vue'

describe('SettingsPanel', () => {
  it('renders and emits updated settings on save', async () => {
    const initial = { darkMode: false, pageSize: 20 }
    const wrapper = mount(SettingsPanel, { props: { settings: initial } })

    // initial state
    const darkToggle = wrapper.find('[data-test="dark-mode-toggle"]')
    const pageSizeInput = wrapper.find('[data-test="page-size-input"]')
    expect(darkToggle.exists()).toBe(true)
    expect(pageSizeInput.exists()).toBe(true)
    expect((pageSizeInput.element as HTMLInputElement).value).toBe('20')

    // toggle dark mode and change page size
    await darkToggle.setValue(true)
    await pageSizeInput.setValue('50')

    // click save
    await wrapper.find('[data-test="save-button"]').trigger('click')

    // emitted update
    const emittedUpdate = wrapper.emitted('update:settings') as unknown as Array<Array<unknown>>
    expect(emittedUpdate).toBeDefined()
    expect(emittedUpdate.length).toBeGreaterThan(0)
    const payload = emittedUpdate[0][0] as { darkMode: boolean; pageSize: number }
    expect(payload).toEqual({ darkMode: true, pageSize: 50 })
  })
})