import { useRef, useState } from "preact/hooks"

export default function PasswordDialog({
	onConfirm,
	onCancel,
	setOpenDialogRef,
}: {
	onConfirm: (password: string) => void
	onCancel: () => void
	setOpenDialogRef: (openDialog: () => void) => void
}) {
	const [error, setError] = useState<string | null>()
	const [password, setPassword] = useState("")

	const dialogRef = useRef<HTMLDialogElement>(null)

	setOpenDialogRef(() => {
		setPassword("")
		dialogRef.current?.showModal()
	})

	function closeDialog() {
		dialogRef.current?.close()
	}

	function handleCancel() {
		onCancel()
		closeDialog()
	}

	function handleSubmit() {
		if (!password) {
			setError("Password is required.")
			return
		}
		onConfirm(password)
		closeDialog()
	}

	return (
		<dialog
			ref={dialogRef}
			class="modal"
			onCancel={(e) => {
				e.preventDefault()
				handleCancel()
			}}
		>
			<form method="dialog" class="modal-box">
				<h3 class="text-lg font-bold mb-4">Login</h3>
				{error && <p class="text-error mb-2">{error}</p>}
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
				<div class="modal-action">
					<button type="button" onClick={handleCancel} class="btn btn-secondary">
						Cancel
					</button>
					<button type="submit" onClick={handleSubmit} class="btn btn-primary">
						Continue
					</button>
				</div>
			</form>
		</dialog>
	)
}
