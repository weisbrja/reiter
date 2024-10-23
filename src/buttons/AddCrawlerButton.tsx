import { useRef } from "preact/hooks"
import { invoke } from "@tauri-apps/api/core"
import { Crawler } from "../App"
import AddCrawlerDialog from "../dialogs/AddCrawlerDialog"

export default function AddCrawlerButton() {
	const openAddCrawlerDialogRef = useRef<() => void | undefined>()

	function handleSave(newCrawler: Crawler) {
		invoke("save_crawler", { oldCrawlerName: undefined, newCrawler }).catch((error) => console.error(error))
	}

	function handleAdd() {
		openAddCrawlerDialogRef.current?.()
	}

	return (
		<div class="w-full p-2">
			<button type="button" class="w-full btn btn-success" onClick={handleAdd}>
				+
			</button>
			<AddCrawlerDialog
				onSave={handleSave}
				setOpenDialogRef={(openDialog) => (openAddCrawlerDialogRef.current = openDialog)}
			/>
		</div>
	)
}
