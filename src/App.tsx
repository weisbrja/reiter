import { useEffect } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import "./App.css"
import SyncAll from "./RunSattel";

export default function App() {
	useEffect(() => { invoke("show_window"); }, []);

	return <SyncAll />;
}
