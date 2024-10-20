import { useState } from "preact/hooks"
import AddCrawlerForm from "../forms/AddCrawlerForm"
import { Popup } from "../components/Popup"
import { Crawler } from "../App"
import { invoke } from "@tauri-apps/api/core"

export default function AddCrawlerButton() {
	const [showForm, setShowForm] = useState(false)

	function handleSubmit(newCrawler: Crawler) {
		invoke("save_crawler", { oldCrawlerName: undefined, newCrawler }).catch((error) => console.error(error))
		setShowForm(false)
	}

	return (
		<div class="w-full p-2">
			<button type="button" class="w-full btn btn-success" onClick={() => setShowForm(true)}>
				+
			</button>
			{showForm && (
				<Popup title="Add Crawler" prevError={""} onCancel={() => setShowForm(false)}>
					<AddCrawlerForm onSubmit={(newCrawler) => handleSubmit(newCrawler)} />
				</Popup>
			)}
		</div>
	)
}
