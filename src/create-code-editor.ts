import { editor } from "monaco-editor-core";

export function createCodeEditor(rootEl: HTMLElement) {
  const codeEditor = editor.create(rootEl, { value: `const a = 123;`, language: "typescript" });
  const resizeCodeEditor = () => codeEditor.layout();
  window.addEventListener("resize", resizeCodeEditor);
  const dispose = () => {
    window.removeEventListener("resize", resizeCodeEditor);
    codeEditor.dispose();
  };

  return { codeEditor, dispose };
}

globalThis.MonacoEnvironment = {
  getWorker: () => new Worker("vendors/monaco-worker.js", { name: "Monaco Generic Worker" }),
};

declare namespace globalThis {
  let MonacoEnvironment: import("monaco-editor-core").Environment | undefined;
}
