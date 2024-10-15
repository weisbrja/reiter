import { useState } from "preact/hooks"
import { Config, Crawler } from "../App"

export default function EditCrawlerForm({
	crawler,
	onSubmit,
}: {
	config: Config | undefined
	crawler: Crawler
	onSubmit: (crawler: Crawler) => void
}) {
	const [name, setName] = useState(crawler.name)
	const [target, setTarget] = useState(crawler.target)
	const [type, setType] = useState(crawler.type)

	function handleSubmit(e: Event) {
		e.preventDefault()

		onSubmit({
			...crawler,
			name,
			target,
			type,
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
					<label class="label-text">Crawler</label>
				</div>
				<select class="select select-bordered" onInput={(e) => setType((e.target as HTMLInputElement).value)}>
					<option value={"kit-ilias-web"}>kit-ilias-web</option>
					<option value={"ilias-web"}>ilias-web</option>
					<option value={"kit-ipd"}>kit-ipd</option>
					<option value={"local"}>local</option>
				</select>
			</div>
			<div class="flex justify-end">
				<button type="submit" class="btn btn-primary" onClick={handleSubmit}>
					Save
				</button>
			</div>
		</form>
	)
}
