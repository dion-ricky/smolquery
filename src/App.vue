<script setup lang="ts">
import PanelManager from './components/PanelManager.vue';
import QueryEditor from './components/QueryEditor.vue';
import ResultsPanel from './components/ResultsPanel.vue';
import SchemaPanel from './components/SchemaPanel.vue';
import SettingsPanel from './components/SettingsPanel.vue';
</script>

<template>
  <div>
    <main>
      <PanelManager>
        <template #query-editor>
          <QueryEditor />
        </template>
        <template #results-panel>
          <ResultsPanel />
        </template>
        <template #schema-panel>
          <SchemaPanel />
        </template>
        <template #settings-panel>
          <SettingsPanel />
        </template>
      </PanelManager>
    </main>
  </div>
</template>

<style scoped>
header {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  background-color: #f8f9fa;
}

main {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 4rem);
}
</style>
