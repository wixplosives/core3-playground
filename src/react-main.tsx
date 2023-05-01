import { createRoot } from "react-dom/client";
import { Editor } from "./components/editor";
import "./main.css";

const reactRoot = createRoot(document.getElementById("root")!);
reactRoot.render(<Editor />);
