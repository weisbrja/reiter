import { useState } from 'preact/hooks'

export default function DropdownSelect({
	onSelect,
	children,
}: {
	onSelect: (selected: string) => void
	children: string[]
}) {
	const [selected, setSelected] = useState<string>()

	function toggleDropdown() {
		const dropdown = document.getElementById('customDropdown')
		if (dropdown) {
			dropdown.classList.toggle('hidden')
		}
	}

	function handleSelect(selected: string) {
		setSelected(selected)
		onSelect(selected)
		toggleDropdown()
	}

	return (
		<div class="mb-4">
			<div
				class="input input-bordered w-full cursor-pointer flex justify-between items-center"
				onClick={toggleDropdown}
			>
				<span>{selected}</span>
				<svg
					class="w-4 h-4 text-primary-content"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
			<div id="customDropdown" class="customDropdown hidden bg-base-100 rounded-box z-10">
				<ul>
					{children.map((child) => (
						<li class="ml-4" onClick={() => handleSelect(child)}>
							{child}
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
