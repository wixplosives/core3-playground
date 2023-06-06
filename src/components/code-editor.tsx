import path from "@file-services/path";
import React, { useEffect } from "react";
import { editor, languages } from "monaco-editor-core";

const monacoWorkerBundleLocation = "vendors/monaco-worker.js";

export namespace CodeEditor {
  export interface Props {
    className?: string | undefined;
    value?: string | undefined;
    filePath?: string | undefined;
  }
}

export const CodeEditor: React.FC<CodeEditor.Props> = React.memo(({ className, value, filePath }) => {
  const containerRef = React.createRef<HTMLDivElement>();

  useEffect(() => {
    const codeEditor = editor.create(containerRef.current!, {
      value: value!,
      language: filePath !== undefined ? extensionToLanguage.get(path.extname(filePath))! : undefined!,
      theme: "vs-dark",
    });
    const resizeCodeEditor = () => codeEditor.layout();
    window.addEventListener("resize", resizeCodeEditor);
    return () => {
      window.removeEventListener("resize", resizeCodeEditor);
      codeEditor.dispose();
    };
  });

  return <div className={className} ref={containerRef} />;
});

CodeEditor.displayName = "CodeEditor";

globalThis.MonacoEnvironment = {
  getWorker: () => new Worker(new URL(monacoWorkerBundleLocation, import.meta.url), { name: "Monaco Generic Worker" }),
};

const extensionToLanguage = new Map<string, string>();
for (const { id, extensions } of languages.getLanguages()) {
  if (extensions) {
    for (const extension of extensions) {
      extensionToLanguage.set(extension, id);
    }
  }
}

declare namespace globalThis {
  let MonacoEnvironment: import("monaco-editor-core").Environment | undefined;
}
