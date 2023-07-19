import { type Compilation } from "./compilation-worker";
import { type BrowserFileSystem } from "./fs/browser-file-system";
import type { Preview } from "./preview";
import { createRPCIframe, type RPCIframe } from "./rpc/rpc-iframe";
import { type RPCWorker } from "./rpc/rpc-worker";
import { getCoduxConfig } from "./helpers/codux";

export class PreviewManager {
  constructor(
    private fs: BrowserFileSystem,
    private compilation: RPCWorker<Compilation>,
    private previews = new Map<string, RPCIframe<Preview>>()
  ) { }
  registerPreview = async (filePath: string, iframe: HTMLIFrameElement) => {
    const previewRPC = createRPCIframe<Preview>(iframe);
    const existingRPC = this.previews.get(filePath);
    if (existingRPC) {
      existingRPC.close();
    }
    this.previews.set(filePath, previewRPC);

    const coduxCodux = await getCoduxConfig(this.fs, "/");
    const boardGlobalSetupPath = coduxCodux?.boardGlobalSetup
      ? await this.compilation.api.resolveSpecifier(this.fs.root, "/", coduxCodux.boardGlobalSetup)
      : undefined;

    const entryModules = boardGlobalSetupPath ? [boardGlobalSetupPath, filePath] : filePath;
    const moduleGraph = await this.compilation.api.calculateModuleGraph(this.fs.root, entryModules);
    if (moduleGraph && this.previews.get(filePath) === previewRPC) {
      await previewRPC.api.evaluateAndRender(
        moduleGraph,
        filePath,
        boardGlobalSetupPath ? boardGlobalSetupPath : undefined
      );
    }
  };
  closePreview = (filePath: string) => {
    const previewRPC = this.previews.get(filePath);
    if (previewRPC) {
      previewRPC.close();
      this.previews.delete(filePath);
    }
  };
  closeAll() {
    for (const previewRPC of this.previews.values()) {
      previewRPC.close();
    }
    this.previews.clear();
  }
}
