// Mock monaco-editor module for tests
export const editor = {
  create: () => ({
    getValue: () => '',
    setValue: () => { },
    dispose: () => { },
    onDidChangeModelContent: () => { },
    addCommand: () => { }
  })
};

export const KeyMod = {
  CtrlCmd: 1
};

export const KeyCode = {
  Enter: 1
};
