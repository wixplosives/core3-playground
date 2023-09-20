import path from "@file-services/path";
import { filePathSourceMapPrefix } from "./source-maps";
import { type AsyncSpecifierResolver } from "./specifier-resolver";

export async function compileUsingSass(
  sass: typeof import("sass"),
  filePath: string,
  getFileContents: (filePath: string) => Promise<string>,
  sassResolver: AsyncSpecifierResolver,
): Promise<string> {
  const parentDirectoryPath = path.dirname(filePath);
  const fileUrl = new URL(`file://` + encodeURI(filePath));
  const start = performance.now();
  const { css } = await sass.compileStringAsync(await getFileContents(filePath), {
    importers: [
      {
        async load(canonicalUrl) {
          const filePath = decodeURI(canonicalUrl.pathname);
          const fileExtension = path.extname(filePath);

          return {
            contents: await getFileContents(filePath),
            syntax: sassSyntaxFromExt(fileExtension),
            sourceMapUrl: new URL(filePathSourceMapPrefix + encodeURI(filePath)),
          };
        },
        async canonicalize(specifier) {
          if (specifier.startsWith("file://")) {
            specifier = new URL(specifier).pathname;
          }
          const { resolvedFile } = await sassResolver(parentDirectoryPath, specifier);
          return resolvedFile ? new URL(`file://` + encodeURI(resolvedFile)) : new URL(specifier, fileUrl);
        },
      },
    ],
  });
  performance.measure(`Transpile ${filePath} (to CSS)`, { start });

  return css;
}

function sassSyntaxFromExt(fileExtension: string): import("sass").Syntax {
  switch (fileExtension) {
    case ".scss":
      return "scss";
    case ".sass":
      return "indented";
    case ".css":
      return "css";
    default:
      return "scss";
  }
}
