import React, { useEffect } from "react";
import { editor, Uri, type Environment } from "monaco-editor-core";

const monacoWorkerURL = new URL("vendors/monaco-generic-worker.js", import.meta.url);
const monacoJsonWorkerURL = new URL("vendors/monaco-json-worker.js", import.meta.url);

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

globalThis.MonacoEnvironment = {
  getWorker: (_workerId, language) => {
    if (language === "json") {
      return new Worker(monacoJsonWorkerURL, { name: "Monaco JSON Worker" });
    } else {
      return new Worker(monacoWorkerURL, { name: "Monaco Generic Worker" });
    }
  },
  createTrustedTypesPolicy: globalThis.trustedTypes?.createPolicy as Environment["createTrustedTypesPolicy"],
};

declare namespace globalThis {
  let MonacoEnvironment: Environment | undefined;
  let trustedTypes: Window["trustedTypes"];
}

export default CodeEditor;
