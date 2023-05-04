import { createCompilationWorker, type CompilationListener, type CompilationWorker } from "./compilation";
import { errorToString, log, logError } from "./log";
import "./monaco-main";
// import "./react-main";

const onCompilationMessage: CompilationListener = (message) => {
  switch (message.type) {
    case "initialized":
      log(`Worker initialized.`);
      break;
    case "error":
      logError(`Compilation Error: ${errorToString(message.error)}`);
      break;
  }
};
const compilation = createCompilationWorker(onCompilationMessage);
globalThis.compilation = compilation;

compilation.postMessage({
  type: "init",
  libVersions: {
    typescript: "5.0.4",
    sass: "1.62.1",
    immutable: "4.3.0",
  },
});

declare namespace globalThis {
  let compilation: CompilationWorker;
}
