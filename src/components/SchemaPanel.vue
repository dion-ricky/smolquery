<template>
  <div data-test="schema-panel">
    <div v-if="!schema || schema.length === 0" data-test="empty">No schema available</div>

    <div v-else>
      <div v-for="table in schema" :key="table.name" class="table" :data-test="`table-${table.name}`">
        <button class="table-header" @click="toggle(table.name)" :data-test="`table-header-${table.name}`">
          {{ table.name }} ({{ table.fields?.length ?? 0 }})
        </button>

        <ul v-show="isOpen(table.name)" class="fields" data-test="fields-list">
          <li v-for="f in table.fields" :key="f.name" data-test="field">
            <span class="field-name">{{ f.name }}</span>: <span class="field-type">{{ f.type }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'

type Field = { name: string; type: string }
type Table = { name: string; fields: Field[] }

export default defineComponent({
  name: 'SchemaPanel',
  props: {
    schema: { type: Array as () => Table[], default: () => [] }
  },
  setup() {
    const openTables = reactive<Record<string, boolean>>({})

    function toggle(name: string) {
      openTables[name] = !openTables[name]
    }

    function isOpen(name: string) {
      return !!openTables[name]
    }

    return { toggle, isOpen, openTables }
  }
})
</script>

<style scoped>
.table {
  margin-bottom: 8px;
}

.table-header {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.fields {
  margin: 6px 0 0 8px;
  padding-left: 12px;
}

.field-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace;
}

.field-type {
  color: #6b7280;
  margin-left: 6px
}
</style>
