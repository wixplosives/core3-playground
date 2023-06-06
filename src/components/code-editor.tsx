import React, { useEffect } from "react";
import { editor, Uri } from "monaco-editor-core";

const monacoWorkerBundleLocation = "vendors/monaco-worker.js";

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
  getWorker: () => new Worker(new URL(monacoWorkerBundleLocation, import.meta.url), { name: "Monaco Generic Worker" }),
  createTrustedTypesPolicy: globalThis.trustedTypes
    ?.createPolicy as import("monaco-editor-core").Environment["createTrustedTypesPolicy"],
};

declare namespace globalThis {
  let MonacoEnvironment: import("monaco-editor-core").Environment | undefined;
  let trustedTypes: Window["trustedTypes"];
}
