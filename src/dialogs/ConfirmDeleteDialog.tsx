import { useRef } from "preact/hooks"

export default function DeleteConfirmDialog({
	crawlerName,
	onConfirm,
	setOpenDialogRef,
}: {
	crawlerName: string
	onConfirm: () => void
	setOpenDialogRef: (openDialog: () => void) => void
}) {
	const dialogRef = useRef<HTMLDialogElement>(null)

	setOpenDialogRef(() => {
		dialogRef.current?.showModal()
	})

	function closeDialog() {
		dialogRef.current?.close()
	}

	function handleSubmit() {
		onConfirm()
		closeDialog()
	}

	return (
		<dialog ref={dialogRef} class="modal">
			<form method="dialog" class="modal-box">
				<h3 class="text-lg font-bold mb-4">Confirm Delete</h3>
				<p class="text-error">
					Delete Crawler <span class="font-bold">{crawlerName}</span>?
				</p>
				<div class="modal-action">
					<button type="reset" class="btn btn-secondary" onClick={closeDialog}>
						Cancel
					</button>
					<button type="button" class="btn btn-error" onClick={handleSubmit}>
						Confirm
					</button>
				</div>
			</form>
		</dialog>
	)
}
