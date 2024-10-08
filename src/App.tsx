import { useEffect } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import "./App.css"
import SyncButton from "./SyncButton";
import Theme from "./Theme";

export default function App() {
	useEffect(() => { invoke("show_window"); }, []);

	return <>
		<div class="absolute top-4 right-4">
			<Theme />
		</div>
		<SyncButton />
	</>;
}
