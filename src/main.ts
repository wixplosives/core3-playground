import { createCompilationWorker, type CompilationListener } from "./compilation";
import { errorToString, logError } from "./log";
import "./monaco-main";
// import "./react-main";

const onCompilationMessage: CompilationListener = (message) => {
  switch (message.type) {
    case "error":
      logError(`Compilation Error: ${errorToString(message.error)}`);
  }
};
const compilation = createCompilationWorker(onCompilationMessage);

compilation.postMessage({
  type: "init",
  libVersions: {
    typescript: "5.0.4",
    sass: "1.62.1",
    immutable: "4.3.0",
  },
});
