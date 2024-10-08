import { useEffect } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import "./app.css"
import SyncAll from "./sattel";

export default function App() {
	useEffect(() => { invoke("show_window"); }, []);

	return <SyncAll />;
}
