import { useState } from "preact/hooks"
import { Config } from "../App"

export default function SettingsForm({
	config,
	onSubmit,
}: {
	config: Config | undefined
	onSubmit: (username: string) => void
}) {
	const [workingDir, setWorkingDir] = useState(config ? config.workingDir : "")

	function handleSubmit(e: Event) {
		e.preventDefault()
		onSubmit(workingDir)
	}

	return (
		<>
			<form onSubmit={handleSubmit}>
				<div class="form-control mb-4">
					<div class="label">
						<label class="label-text">Working directory</label>
					</div>
					<input
						type="text"
						id="workingDir"
						value={workingDir}
						onInput={(e) => setWorkingDir((e.target as HTMLInputElement).value)}
						class="input input-bordered"
					/>
				</div>
				<div class="flex justify-end">
					<button type="submit" class="btn btn-primary">
						Save
					</button>
				</div>
			</form>
		</>
	)
}
