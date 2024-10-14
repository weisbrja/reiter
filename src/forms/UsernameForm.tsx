import { useState } from "preact/hooks";
import { usePopupErrorContext } from "../components/Popup";

export function UsernameForm({ onSubmit }: { onSubmit: (username: string) => void; }) {
	const { setError, onCancel } = usePopupErrorContext();
	const [username, setUsername] = useState("");

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (!username) {
			setError("Username required.");
			return;
		}

		onSubmit(username);
	}

	return (
		<form onSubmit={handleSubmit}>
			<div class="form-control mb-4">
				<div class="label">
					<label class="label-text">Username</label>
				</div>
				<input
					type="text"
					id="username"
					value={username}
					onInput={e => setUsername((e.target as HTMLInputElement).value)}
					class="input input-bordered"
					placeholder="Enter your username" />
			</div>
			<div class="flex justify-end">
				<button type="button" onClick={onCancel} class="btn btn-error mr-4">Cancel</button>
				<button type="submit" class="btn btn-primary">Continue</button>
			</div>
		</form>
	);
}
