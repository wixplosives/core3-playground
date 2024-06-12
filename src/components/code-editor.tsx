import { Uri, editor } from "monaco-editor";
import React, { useEffect, useMemo } from "react";

export namespace CodeEditor {
  export interface Props {
    className?: string | undefined;
    value?: string | undefined;
    filePath?: string | undefined;
    language?: string | undefined;
    onChange?: ((filePath: string, value: string) => void) | undefined;
  }
}


const CodeEditor: React.FC<CodeEditor.Props> = ({ className, value = "", filePath, language, onChange }) => {
  const containerRef = React.createRef<HTMLDivElement>();
  const ctrl = useMemo(() => new CodeEditorController(), []);
  useEffect(() => ctrl.createMonacoEditor(containerRef.current!), [ctrl, containerRef]);
  useEffect(() => {
    const model = editor.createModel(value, language, filePath ? Uri.file(filePath) : undefined);
    ctrl.setModel(model);
    const changeListener = model.onDidChangeContent(() => onChange?.(filePath || "", model.getValue()));
    return () => {
      changeListener.dispose();
      model.dispose();
    };
  }, [value, filePath, language, onChange, ctrl]);

  return <div className={className} ref={containerRef} />;
};

CodeEditor.displayName = "CodeEditor";

const MemoizedCodeEditor = React.memo(CodeEditor);

export { MemoizedCodeEditor as CodeEditor };
export default MemoizedCodeEditor;

class CodeEditorController {
  codeEditor!: editor.IStandaloneCodeEditor;
  createMonacoEditor(el: HTMLDivElement) {
    if (this.codeEditor) {
      this.codeEditor.dispose();
    }
    this.codeEditor = editor.create(el, { theme: "vs-dark" });
    return this.bindEvents();
  }
  setModel(model: editor.ITextModel) {
    this.codeEditor.setModel(model);
  }
  private bindEvents() {
    const resizeCodeEditor = () => this.codeEditor.layout();
    window.addEventListener("resize", resizeCodeEditor);
    return () => {
      window.removeEventListener("resize", resizeCodeEditor);
      this.codeEditor.dispose();
    };
  }
}
