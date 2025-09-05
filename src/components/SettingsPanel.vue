<template>
  <div data-test="settings-panel">
    <div class="row">
      <label>
        <input type="checkbox" v-model="local.darkMode" data-test="dark-mode-toggle" />
        Dark mode
      </label>
    </div>

    <div class="row">
      <label>
        Page size:
        <input type="number" v-model.number="local.pageSize" min="1" data-test="page-size-input" />
      </label>
    </div>

    <div class="actions">
      <button @click="save" data-test="save-button">Save</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, watch } from 'vue'

export default defineComponent({
  name: 'SettingsPanel',
  props: {
    settings: {
      type: Object as () => { darkMode: boolean; pageSize: number },
      default: () => ({ darkMode: false, pageSize: 10 })
    }
  },
  emits: ['update:settings'],
  setup(props, { emit }) {
    const local = reactive({
      darkMode: !!props.settings.darkMode,
      pageSize: props.settings.pageSize ?? 10
    })

    watch(
      () => props.settings,
      (s) => {
        local.darkMode = !!s.darkMode
        local.pageSize = s.pageSize ?? 10
      },
      { deep: true }
    )

    function save() {
      emit('update:settings', { darkMode: !!local.darkMode, pageSize: Number(local.pageSize) })
    }

    return { local, save }
  }
})
</script>

<style scoped>
.row {
  margin-bottom: 8px;
}

.actions {
  margin-top: 12px;
}
</style>
