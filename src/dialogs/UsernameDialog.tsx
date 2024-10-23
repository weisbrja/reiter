import { useEffect, useRef, useState } from "preact/hooks"

export default function UsernameDialog({
	loginFailed,
	onConfirm,
	onCancel,
	setOpenDialogRef,
}: {
	loginFailed: boolean
	onConfirm: (username: string) => void
	onCancel: () => void
	setOpenDialogRef: (openDialog: () => void) => void
}) {
	const [error, setError] = useState<string | null>()
	const [username, setUsername] = useState("")

	const inputRef = useRef<HTMLInputElement>(null)
	const dialogRef = useRef<HTMLDialogElement>(null)

	setOpenDialogRef(() => {
		if (loginFailed) {
			inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length)
		} else {
			setUsername("")
		}
		dialogRef.current?.showModal()
	})

	useEffect(() => {
		setError(loginFailed ? "Login failed. Please reenter credentials." : null)
	}, [loginFailed])

	function closeDialog() {
		dialogRef.current?.close()
	}

	function handleCancel() {
		onCancel()
		closeDialog()
	}

	function handleSubmit() {
		if (!username) {
			setError("Username is required.")
			return
		}
		onConfirm(username)
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
						<label class="label-text">Username</label>
					</div>
					<input
						ref={inputRef}
						type="text"
						id="username"
						value={username}
						onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
						class="input input-bordered"
						placeholder="Enter your username"
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
