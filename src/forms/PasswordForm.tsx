import { useState } from "preact/hooks"
import { useFormErrorContext } from "../components/Popup"

export default function PasswordForm({ onSubmit }: { onSubmit: (password: string) => void }) {
	const { setError, onCancel } = useFormErrorContext()
	const [password, setPassword] = useState("")

	function handleSubmit(e: Event) {
		e.preventDefault()

		if (!password) {
			setError("Password is required.")
			return
		}

		onSubmit(password)
	}

	return (
		<form onSubmit={handleSubmit}>
			<div class="form-control mb-4">
				<div class="label">
					<label class="label-text">Password</label>
				</div>
				<input
					type="password"
					id="password"
					value={password}
					onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
					class="input input-bordered"
					placeholder="Enter your password"
				/>
			</div>
			<div class="flex justify-end">
				<button type="button" onClick={onCancel} class="btn btn-error mr-4">
					Cancel
				</button>
				<button type="submit" class="btn btn-primary">
					Login
				</button>
			</div>
		</form>
	)
}
