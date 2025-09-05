<template>
  <div data-test="results-panel">
    <div v-if="loading" data-test="loading-indicator">Loading...</div>
    <table v-else data-test="results-table">
      <tbody>
        <tr v-for="(r, i) in results" :key="i" data-test="result-row">
          <td>{{ r.id }}</td>
          <td>{{ r.name }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ResultsPanel',
  props: {
    results: { type: Array as () => Array<{ id: number; name: string }>, default: () => [] },
    loading: { type: Boolean, default: false }
  }
})
</script>

<style scoped>
/* minimal */
</style>
