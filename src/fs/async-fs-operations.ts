import type { IndentedList } from "../components/indented-list";
import { directoryNameToIcon, fileNameToIcon } from "../helpers/icons";
import type { AsyncFileSystem } from "./async-fs-api";

export async function* generateIndentedFsItems(
  fs: AsyncFileSystem,
  directoryPath: string,
  expandedDirectories: Set<string>,
  depth = 0
): AsyncGenerator<IndentedList.Item> {
  for await (const item of await fs.openDirectory(directoryPath)) {
    const isDirectory = item.type === "directory";
    const isExpanded = expandedDirectories.has(item.path);
    if (isDirectory && item.name === ".git") {
      continue;
    }
    yield {
      id: item.path,
      depth,
      label: item.name,
      iconUrl: isDirectory ? directoryNameToIcon(item.name, isExpanded) : fileNameToIcon(item.name),
      type: item.type,
    };
    if (isDirectory && isExpanded) {
      yield* generateIndentedFsItems(fs, item.path, expandedDirectories, depth + 1);
    }
  }
}
