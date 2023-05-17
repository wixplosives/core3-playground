// monaco
import type { IFileSystem } from "./fs/fs-api";
import { createCodeEditor } from "./create-code-editor";
// import { createMemoryFs } from "./fs/memory-fs";
// import { cloneGitRepo } from "./git";

globalThis.MonacoEnvironment = {
  getWorker: function (_moduleId: unknown, _label: string) {
    return new Worker("vendors/monaco-worker.js", { name: "Monaco Generic Worker" });
  },
};

const codeEditorRootEl = document.getElementById("root") ?? document.body.appendChild(document.createElement("div"));
createCodeEditor(codeEditorRootEl);
// const fs = createMemoryFs();

// const githubRepo = "wix/stylable";
// const repoUrl = `https://github.com/${githubRepo}`;
// await cloneGitRepo(fs, repoUrl);
// globalThis.fs = fs;

// const content = await fs.promises.readFile("/README.md", "utf8");
// codeEditor.setValue(content);

declare namespace globalThis {
  let MonacoEnvironment: import("monaco-editor-core").Environment | undefined;
  let fs: IFileSystem;
}
