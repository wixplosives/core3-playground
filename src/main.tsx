import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PlaygroundApp } from "./playground-app";
import { Editor } from "./components/editor";
import "./helpers/reset.css";
import "./main.css";

const root = createRoot(document.getElementById("root")!);

const app = new PlaygroundApp(() => {
  const project = app.projects.getActiveProject();
  root.render(
    <StrictMode>
      <Editor
        openFiles={project?.openFiles ?? []}
        selectedFileIdx={project?.selectedFileIdx ?? -1}
        fileTreeItems={project?.fileTreeItems ?? []}
        savedProjectNames={app.savedProjectNames}
        onTabClick={app.selectOpenedFile}
        onTabClose={app.closeOpenFile}
        onOpenLocal={app.openLocalProject}
        onFileTreeItemClick={app.onFileTreeItemClick}
        onOpenSaved={app.openSavedProject}
        onClearSaved={app.removeSavedProject}
      />
    </StrictMode>,
  );
});

await app.loadSavedProjects();
