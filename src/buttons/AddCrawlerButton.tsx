import { useState } from "preact/hooks"
import AddCrawlerForm from "../forms/AddCrawlerForm"
import { Popup } from "../components/Popup"
import { Crawler } from "../App"

export default function AddCrawlerButton() {
	const [showForm, setShowForm] = useState(false)

	function handleSubmit(crawler: Crawler) {
		console.info("Crawler added", crawler)
		setShowForm(false)
	}

	return (
		<div class="w-full p-4">
			<button class="w-full btn btn-success" onClick={() => setShowForm(true)}>
				+
			</button>
			{showForm && (
				<Popup title="Add Crawler" prevError={""} onCancel={() => setShowForm(false)}>
					<AddCrawlerForm onSubmit={(crawler) => handleSubmit(crawler)} />
				</Popup>
			)}
		</div>
	)
}
