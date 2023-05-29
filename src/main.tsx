import "./variables.css";
import "./main.css";
import { PlaygroundApp } from "./playground-app";

const app = new PlaygroundApp();
app.showUI(document.getElementById("root")!);
