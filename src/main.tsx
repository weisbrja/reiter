import { render } from "preact";
import App from "./App";
import { StrictMode } from "preact/compat";

render(<StrictMode><App /></StrictMode>, document.getElementById("app")!);
// render(<App />, document.getElementById("app")!);
