import { useState } from "preact/hooks"
import { useFormErrorContext } from "../components/Popup"
import { Crawler } from "../App"
import DropdownSelect from "../components/DropdownSelect"
import { invoke } from "@tauri-apps/api/core"

export const crawlerTypes = ["kit-ilias-web", "kit-ipd", "ilias-web", "local"]

export default function AddCrawlerForm({ onSubmit }: { onSubmit: (crawler: Crawler) => void }) {
	const { setError, onCancel } = useFormErrorContext()

	const [name, setName] = useState("")
	const [target, setTarget] = useState("")
	const [type, setCrawlerType] = useState(crawlerTypes[0])

	function handleSubmit(e: Event) {
		e.preventDefault()

		if (!name) {
			setError("Name is required.")
			return
		}

		if (!target) {
			setError("Target is required.")
			return
		}

		const crawler: Crawler = {
			name,
			target,
			type,
			videos: false,
		}

		invoke("crawler_exists", { crawlerName: name })
			.then((crawlerExists) => {
				if (crawlerExists) {
					setError("Crawler exists already.")
				} else {
					onSubmit(crawler)
				}
			})
			.catch((error) => console.error(error))
	}
	return (
		<form>
			<div class="form-control mb-4">
				<div class="label">
					<label class="label-text">Name</label>
				</div>
				<input
					type="text"
					id="name"
					value={name}
					onInput={(e) => setName((e.target as HTMLInputElement).value)}
					class="input input-bordered"
				/>
				<div class="label">
					<label class="label-text">Target</label>
				</div>
				<input
					type="text"
					id="crawler"
					value={target}
					onInput={(e) => setTarget((e.target as HTMLInputElement).value)}
					class="input input-bordered"
				/>
				<div class="label">
					<label class="label-text">Crawler Type</label>
				</div>
				<div class="mb-4">
					<DropdownSelect onSelect={setCrawlerType}>{crawlerTypes}</DropdownSelect>
				</div>
			</div>
			<div class="flex justify-end gap-x-4">
				<button type="button" class="btn btn-secondary" onClick={onCancel}>
					Cancel
				</button>
				<button type="submit" class="btn btn-primary" onClick={handleSubmit}>
					Confirm
				</button>
			</div>
		</form>
	)
}
