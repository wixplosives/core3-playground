import type { CompilationWorkerProtocol } from "./compilation-protocol";

export type CompilationListener = (message: CompilationWorkerProtocol) => void;

export function createCompilationWorker(onMessage: CompilationListener) {
  const worker = new Worker("compilation-worker.js", { name: "Compilation" });

  const messageListener = ({ data }: MessageEvent<CompilationWorkerProtocol>) => onMessage(data);
  worker.addEventListener("message", messageListener);

  function dispose() {
    worker.removeEventListener("message", messageListener);
    worker.terminate();
  }

  function postMessage(message: CompilationWorkerProtocol): void {
    worker.postMessage(message);
  }
  return { worker, postMessage, dispose };
}
