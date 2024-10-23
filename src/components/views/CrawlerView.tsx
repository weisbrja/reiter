import { invoke } from "@tauri-apps/api/core"
import { Config, Crawler } from "../../App"
import { SyncButton } from "../../buttons/SyncButton"
import Bar from "../Bar"
import { useRef, useState } from "preact/hooks"
import DropdownSelect from "../DropdownSelect"
import { crawlerTypes } from "../../dialogs/AddCrawlerDialog"
import ConfirmDeleteDialog from "../../dialogs/ConfirmDeleteDialog"

export default function CrawlerView({
	config,
	crawlerName,
	setCrawlerName,
}: {
	config: Config | undefined
	crawlerName: string
	setCrawlerName: (crawlerName: string | null) => void
}) {
	const [resetKey, setResetKey] = useState(0)

	const crawler = config?.crawlers.find((crawler) => crawler.name === crawlerName)

	// TODO: the crawler is undefined for a short period of time, because it can't be found in the config
	console.info("showing crawler", crawler)

	async function onSave(newCrawler: Crawler) {
		await invoke("save_crawler", { oldCrawlerName: crawlerName, newCrawler }).catch((error) => console.error(error))
		setCrawlerName(newCrawler.name)
	}

	function onDelete() {
		console.info("deleting crawler")
		invoke("delete_crawler", { crawlerName }).catch((error) => console.error(error))
		onBack()
	}

	function onCancel() {
		setResetKey((prevKey) => prevKey + 1)
	}

	function onBack() {
		setCrawlerName(null)
	}

	return (
		<>
			<Bar>
				<button type="button" class="btn btn-secondary" onClick={onBack}>
					Back
				</button>
				<h1 class="w-full text-2xl font-bold text-center">{crawlerName}</h1>
				<div class="total right-2">
					<SyncButton crawler={crawlerName} />
				</div>
			</Bar>
			{crawler && (
				<EditCrawlerViewForm key={resetKey} crawler={crawler} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />
			)}
		</>
	)
}

function EditCrawlerViewForm({
	crawler,
	onSave,
	onCancel,
	onDelete,
}: {
	crawler: Crawler
	onSave: (newCrawler: Crawler) => void
	onCancel: () => void
	onDelete: () => void
}) {
	const [error, setError] = useState<string | null>(null)

	const [name, setName] = useState(crawler.name)
	const [target, setTarget] = useState(crawler.target)
	const [type, setType] = useState(crawler.type)

	const openConfirmDeleteDialogRef = useRef<() => void | undefined>()

	function handleSave(e: Event) {
		e.preventDefault()

		if (!name) {
			setError("Name is required.")
			return
		}

		if (!target) {
			setError("Target is required.")
			return
		}

		onSave({
			...crawler,
			name,
			target,
			type,
		})
	}

	function handleDelete() {
		openConfirmDeleteDialogRef.current?.()
	}

	return (
		<div class="p-4">
			{error && <p class="text-error mb-2">{error}</p>}
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
						<DropdownSelect isDropdown={true} initial={type} onSelect={setType}>
							{crawlerTypes}
						</DropdownSelect>
					</div>
				</div>
				<div class="flex justify-between gap-x-4">
					<button type="button" onClick={handleDelete} class="btn btn-error">
						Delete
					</button>
					<div class="flex gap-x-4">
						<button type="reset" onClick={onCancel} class="btn btn-secondary">
							Cancel
						</button>
						<button type="submit" class="btn btn-primary" onClick={handleSave}>
							Save
						</button>
					</div>
				</div>
				<ConfirmDeleteDialog
					crawlerName={crawler.name}
					onConfirm={onDelete}
					setOpenDialogRef={(openDialog) => (openConfirmDeleteDialogRef.current = openDialog)}
				/>
			</form>
		</div>
	)
}
