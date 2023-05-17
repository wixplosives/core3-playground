import type { FileTree } from "./components/file-tree";
import { directoryNameToIcon, fileNameToIcon } from "./icons/path-to-icon";

export const sampleDirectoryData: FileTree.DirectoryItem[] = [
  fsObjectToDirectoryItem("project", "/project", {
    src: {
      components: {
        "auto-complete.tsx": "",
        "auto-complete.css": "",
        "dropdown.tsx": "",
        "dropdown.css": "",
      },
      hooks: {
        "use-history.ts": "",
        "use-local-storage.ts": "",
      },
    },
    test: {
      "auto-complete.spec.tsx": "",
      "dropdown.spec.tsx": "",
    },
    "index.html": "",
    "webpack.config.js": "",
  }),
  fsObjectToDirectoryItem("another", "/another", {
    src: {
      components: {
        "auto-complete.tsx": "",
        "auto-complete.css": "",
        "dropdown.tsx": "",
        "dropdown.css": "",
      },
      hooks: {
        "use-history.ts": "",
        "use-local-storage.ts": "",
      },
    },
    test: {
      "auto-complete.spec.tsx": "",
      "dropdown.spec.tsx": "",
    },
    "index.html": "",
    "webpack.config.js": "",
  }),
];

interface DirectoryObject {
  [name: string]: string | DirectoryObject;
}

function fsObjectToDirectoryItem(directoryName: string, directoryPath: string, directoryObject: DirectoryObject) {
  const directoryItem: FileTree.DirectoryItem = {
    type: "directory",
    name: directoryName,
    path: directoryPath,
    children: [],
    id: directoryPath,
    iconUrl: directoryNameToIcon(directoryName),
  };
  for (const [name, value] of Object.entries(directoryObject)) {
    const itemPath = joinPathSegment(directoryPath, name);
    if (typeof value === "string") {
      directoryItem.children.push({
        type: "file",
        name,
        path: itemPath,
        id: itemPath,
        iconUrl: fileNameToIcon(name),
      });
    } else {
      directoryItem.children.push(fsObjectToDirectoryItem(name, itemPath, value));
    }
  }
  return directoryItem;
}

function joinPathSegment(path: string, segment: string) {
  return `${path}${path.endsWith("/") ? "" : "/"}${segment}`;
}
