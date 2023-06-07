import { Uri, editor } from "monaco-editor";
import React, { useEffect } from "react";

export namespace CodeEditor {
  export interface Props {
    className?: string | undefined;
    value?: string | undefined;
    filePath?: string | undefined;
    language?: string | undefined;
  }
}

export const CodeEditor: React.FC<CodeEditor.Props> = React.memo(({ className, value = "", filePath, language }) => {
  const containerRef = React.createRef<HTMLDivElement>();

  useEffect(() => {
    const model = editor.createModel(value, language, filePath ? Uri.file(filePath) : undefined);
    const codeEditor = editor.create(containerRef.current!, {
      model,
      theme: "vs-dark",
    });
    const resizeCodeEditor = () => codeEditor.layout();
    window.addEventListener("resize", resizeCodeEditor);
    return () => {
      window.removeEventListener("resize", resizeCodeEditor);
      codeEditor.dispose();
      model.dispose();
    };
  });

  return <div className={className} ref={containerRef} />;
});

CodeEditor.displayName = "CodeEditor";

export default CodeEditor;
