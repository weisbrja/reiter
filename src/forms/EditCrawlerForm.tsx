import { useState } from "preact/hooks"
import { Crawler } from "../App"
import { Popup, useFormErrorContext } from "../components/Popup"
import { crawlerTypes } from "./AddCrawlerForm"
import DropdownSelect from "../components/DropdownSelect"

export default function EditCrawlerForm({
	crawler,
	onSubmit,
	onDelete,
}: {
	crawler: Crawler
	onSubmit: (crawler: Crawler) => void
	onDelete: () => void
}) {
	const { setError, onCancel } = useFormErrorContext()

	const [name, setName] = useState(crawler.name)
	const [target, setTarget] = useState(crawler.target)
	const [type, setCrawlerType] = useState(crawler.type)
	const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

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

		onSubmit({
			name,
			target,
			type,
			videos: false,
		})
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
			<div class="flex justify-between gap-x-4">
				<button type="button" onClick={() => setConfirmDeleteOpen(true)} class="btn btn-error">
					Delete
				</button>
				<div class="flex gap-x-4">
					<button type="reset" onClick={onCancel} class="btn btn-secondary">
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" onClick={handleSubmit}>
						Save
					</button>
				</div>
			</div>
			{isConfirmDeleteOpen && (
				<Popup
					title="Confirm Delete"
					prevError=""
					onCancel={() => {
						setConfirmDeleteOpen(false)
					}}
				>
					<ConfirmDeleteForm
						onConfirm={() => {
							onDelete()
							setConfirmDeleteOpen(false)
						}}
						crawlerName={crawler.name}
					/>
				</Popup>
			)}
		</form>
	)
}

export function ConfirmDeleteForm({
	onConfirm: onSubmit,
	crawlerName,
}: {
	onConfirm: () => void
	crawlerName: string
}) {
	const { onCancel } = useFormErrorContext()

	return (
		<>
			<div class="mb-4">
				<span class="text-error">
					Delete Crawler <span class="font-bold">{crawlerName}</span>?
				</span>
			</div>
			<div class="flex justify-end gap-x-4">
				<button type="reset" class="btn btn-secondary" onClick={onCancel}>
					Cancel
				</button>
				<button type="button" class="btn btn-error" onClick={onSubmit}>
					Confirm
				</button>
			</div>
		</>
	)
}
