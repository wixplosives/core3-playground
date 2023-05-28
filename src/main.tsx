import { createRoot } from "react-dom/client";
import { Editor } from "./components/editor";
import { createRPCWorker } from "./rpc/rpc-worker";
import type { Compilation } from "./compilation/compilation-worker";
import "./variables.css";
import "./main.css";

const reactRoot = createRoot(document.getElementById("root")!);
reactRoot.render(<Editor />);

const compilationWorkerURL = new URL("compilation-worker.js", import.meta.url);
const compilationWorker = createRPCWorker<Compilation>(compilationWorkerURL, "Compilation");

await compilationWorker.api.initialize({
  typescript: "5.0.4",
  sass: "1.62.1",
  immutable: "4.3.0",
});

globalThis.compilation = compilationWorker;

declare namespace globalThis {
  let compilation: typeof compilationWorker;
}
