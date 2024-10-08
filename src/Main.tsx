import { render } from "preact";
import { StrictMode } from "preact/compat";
import App from "./App";

render(<StrictMode><App /></StrictMode>, document.getElementById("app")!);
// render(<App />, document.getElementById("app")!);
