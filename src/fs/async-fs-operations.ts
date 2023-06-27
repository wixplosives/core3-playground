import type { IndentedList } from "../components/indented-list";
import { directoryNameToIcon, fileNameToIcon } from "../helpers/icons";
import type { FileSystemDirectoryItem } from "./async-fs-api";

export async function* generateIndentedFsItems(
  directoryItem: FileSystemDirectoryItem,
  expandedDirectories: ReadonlySet<string>,
  ignoredDirectories: ReadonlySet<string> = new Set<string>(),
  depth = 0
): AsyncGenerator<IndentedList.Item> {
  for await (const item of directoryItem) {
    const isDirectory = item.type === "directory";
    const isExpanded = expandedDirectories.has(item.path);
    if (isDirectory && ignoredDirectories.has(item.name)) {
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
      yield* generateIndentedFsItems(item, expandedDirectories, ignoredDirectories, depth + 1);
    }
  }
}
