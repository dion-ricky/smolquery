<template>
  <div class="query-editor">
    <div v-if="monacoLoaded" ref="editorContainer" class="editor-container"></div>
    <textarea v-else class="editor-fallback" :value="value" @input="onTextareaInput" @keydown="onTextareaKeydown"
      spellcheck="false"></textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

export default defineComponent({
  name: 'QueryEditor',
  props: {
    modelValue: { type: String, default: '' },
    language: { type: String, default: 'sql' },
    options: { type: Object, default: () => ({}) }
  },
  emits: ['update:modelValue', 'execute'],
  setup(props, { emit }) {
    const editorContainer = ref<HTMLElement | null>(null)
    const monacoLoaded = ref(false)
    let monaco: unknown = null
    let editor: unknown = null

    const value = ref(props.modelValue)

    watch(() => props.modelValue, (v) => {
      if (v !== value.value) value.value = v
      if (editor && (editor as any).getValue && (editor as any).getValue() !== v) {
        ; (editor as any).setValue(v)
      }
    })

    const onDidChangeModelContent = () => {
      const v = (editor as any).getValue()
      value.value = v
      emit('update:modelValue', v)
    }

    const onExecute = () => emit('execute')

    const onTextareaInput = (e: Event) => {
      const v = (e.target as HTMLTextAreaElement).value
      value.value = v
      emit('update:modelValue', v)
    }

    const onTextareaKeydown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const exec = (isMac ? e.metaKey : e.ctrlKey) && e.key === 'Enter'
      if (exec) {
        e.preventDefault()
        onExecute()
      }
    }

    onMounted(async () => {
      // try dynamic import of monaco-editor
      try {
        // load the esm build if available
        // use a dynamic import so app can still run without Monaco
        monaco = await import('monaco-editor')
        monacoLoaded.value = true
        await nextTick()
        if (editorContainer.value) {
          editor = (monaco as any).editor.create(editorContainer.value, {
            value: props.modelValue || '',
            language: props.language || 'sql',
            automaticLayout: true,
            minimap: { enabled: false },
            ...props.options
          })
            ; (editor as any).onDidChangeModelContent(onDidChangeModelContent)

            // execute shortcut: Ctrl/Cmd+Enter
            ; (editor as any).addCommand((monaco as any).KeyMod.CtrlCmd | (monaco as any).KeyCode.Enter, () => {
              onExecute()
            })
        }
      } catch (_err) {
        // Monaco failed to load; fallback will render
        monacoLoaded.value = false
        // no-op
      }
    })

    onBeforeUnmount(() => {
      if (editor) {
        try {
          ; (editor as any).dispose()
        } catch (_e) { }
      }
    })

    return { editorContainer, monacoLoaded, value, onTextareaInput, onTextareaKeydown }
  }
})
</script>

<style scoped>
.query-editor {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.editor-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.editor-fallback {
  width: 100%;
  height: 100%;
  min-height: 200px;
  box-sizing: border-box;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace;
  font-size: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
</style>