// monaco
import { type IMemFileSystem } from "./fs/memory-fs";
// import { cloneGitRepo } from "./git";
import { createCodeEditor } from "./create-code-editor";
import "./main.css";

globalThis.MonacoEnvironment = {
  getWorker: function (_moduleId: unknown, _label: string) {
    return new Worker("vendors/monaco-worker.js", { name: "Monaco Generic Worker" });
  },
};

declare namespace globalThis {
  let MonacoEnvironment: import("monaco-editor-core").Environment | undefined;
  let fs: IMemFileSystem;
}

const codeEditorRootEl = document.getElementById("root") ?? document.body.appendChild(document.createElement("div"));
createCodeEditor(codeEditorRootEl);
// const fs = createMemoryFs();

// const githubRepo = "wix/stylable";
// const repoUrl = `https://github.com/${githubRepo}`;
// const fs = await cloneGitRepo(repoUrl);
// globalThis.fs = fs;

// const content = await fs.promises.readFile("/README.md", "utf8");
// codeEditor.setValue(content);
