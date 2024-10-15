export default function SettingsButton({
	onClick,
	children,
}: {
	onClick: () => void
	children: string
}) {
	return (
		<button class="btn btn-error" onClick={onClick}>
			{children}
		</button>
	)
}
