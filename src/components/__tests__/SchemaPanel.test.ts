import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SchemaPanel from '../SchemaPanel.vue'

describe('SchemaPanel', () => {
  it('renders empty message when no schema', () => {
    const wrapper = mount(SchemaPanel, { props: { schema: [] } })
    expect(wrapper.text()).toContain('No schema available')
  })

  it('renders tables and fields and toggles open', async () => {
    const schema = [
      { name: 'users', fields: [{ name: 'id', type: 'INT' }, { name: 'email', type: 'STRING' }] },
      { name: 'orders', fields: [{ name: 'id', type: 'INT' }] }
    ]
    const wrapper = mount(SchemaPanel, { props: { schema } })

    // headers present
    expect(wrapper.find('[data-test="table-header-users"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="table-header-orders"]').exists()).toBe(true)

    // fields hidden for users initially (v-show keeps elements in DOM, so check visibility)
    const usersTable = wrapper.find('[data-test="table-users"]').exists() ? wrapper.find('[data-test="table-users"]') : wrapper.find('[data-test="table-users"]')
    expect(usersTable.exists()).toBe(true)
    const usersFields = usersTable.find('[data-test="fields-list"]')
    expect(usersFields.exists()).toBe(true)

    // v-show keeps elements in DOM; verify inline display style is 'none' when hidden
    expect(usersFields.attributes('style') || '').toContain('display: none')

    // click to open users and wait for DOM update
    await wrapper.find('[data-test="table-header-users"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(usersFields.attributes('style') || '').not.toContain('display: none')
    expect(usersTable.findAll('[data-test="field"]').length).toBe(2)
    expect(wrapper.text()).toContain('email')
  })
})