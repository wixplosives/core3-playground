import type { BrowserFileSystem } from "../fs/browser-file-system";
import type { AnalyzedModule } from "../helpers/module-graph-resolver";
import type { AsyncSpecifierResolver } from "../helpers/specifier-resolver";

export interface ModuleAnalyzerContext {
  filePath: string;
  fs: BrowserFileSystem;
  fileExtension: string;
  ts: typeof import("typescript");
  sass: typeof import("sass");
  specifierResolver: AsyncSpecifierResolver;
  cssAssetResolver: AsyncSpecifierResolver;
  sassModuleResolver: AsyncSpecifierResolver;
}

export interface ModuleAnalyzer {
  test: (context: ModuleAnalyzerContext) => boolean;
  analyze: (context: ModuleAnalyzerContext) => AnalyzedModule | Promise<AnalyzedModule>;
}
