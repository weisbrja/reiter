import { useRef, useState } from "preact/hooks"
import { Crawler } from "../App"
import { invoke } from "@tauri-apps/api/core"
import DropdownSelect from "../components/DropdownSelect"

export const crawlerTypes = ["kit-ilias-web", "kit-ipd", "ilias-web", "local"]

export default function AddCrawlerDialog({
	onSave,
	setOpenDialogRef,
}: {
	onSave: (crawler: Crawler) => void
	setOpenDialogRef: (openDialog: () => void) => void
}) {
	const [error, setError] = useState<string | null>()
	const [name, setName] = useState("")
	const [target, setTarget] = useState("")
	const [type, setCrawlerType] = useState(crawlerTypes[0])

	const dialogRef = useRef<HTMLDialogElement>(null)

	setOpenDialogRef(() => {
		setName("")
		setTarget("")
		setCrawlerType(crawlerTypes[0])
		dialogRef.current?.showModal()
	})

	function closeDialog() {
		dialogRef.current?.close()
	}

	async function handleConfirm(e: Event) {
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
			auth: "auth:ilias",
		}

		try {
			const crawlerExists = await invoke("crawler_exists", { crawlerName: name })
			if (crawlerExists) {
				setError("Crawler exists already.")
			} else {
				onSave(crawler)
				closeDialog()
			}
		} catch (error) {
			console.error(error)
		}
	}

	return (
		<dialog ref={dialogRef} class="modal">
			<form method="dialog" class="modal-box relative">
				<h3 class="text-lg font-bold mb-4">Add Crawler</h3>
				{error && <p class="text-error mb-2">{error}</p>}
				<div class="form-control mb-4 relative">
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
						<DropdownSelect isDropdown={false} initial={type} onSelect={setCrawlerType}>
							{crawlerTypes}
						</DropdownSelect>
					</div>
				</div>
				<div class="modal-action">
					<button type="button" onClick={closeDialog} class="btn btn-secondary">
						Cancel
					</button>
					<button type="submit" onClick={handleConfirm} class="btn btn-primary">
						Continue
					</button>
				</div>
			</form>
		</dialog>
	)
}
