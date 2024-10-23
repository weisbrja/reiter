import { useEffect, useState } from "preact/hooks"

export default function DropdownSelect({
	initial,
	onSelect,
	children,
	isDropdown,
}: {
	initial: string
	onSelect: (selected: string) => void
	children: string[]
	isDropdown: boolean
}) {
	const [selected, setSelected] = useState(initial)
	const [isDropdownOpen, setDropdownOpen] = useState(false)

	function closeDropdown() {
		setDropdownOpen(false)
	}

	function toggleDropdown() {
		setDropdownOpen(!isDropdownOpen)
	}

	function handleSelect(selected: string) {
		setSelected(selected)
		onSelect(selected)
		closeDropdown()
	}

	useEffect(() => {
		if (isDropdownOpen) {
			window.addEventListener("click", closeDropdown)
		} else {
			window.removeEventListener("click", closeDropdown)
		}

		return () => window.removeEventListener("click", closeDropdown)
	}, [isDropdownOpen])

	return (
		<div class="relative w-full">
			<div
				tabIndex={0}
				class="input input-bordered w-full cursor-pointer flex justify-between items-center"
				onClick={toggleDropdown}
			>
				<span>{selected}</span>
				<svg class="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
			{isDropdownOpen && (
				<ul class={`absolute mt-2 w-full rounded-box bg-base-200 z-100 ${isDropdown ? "mt-2" : "bottom-full mb-2"}`}>
					<div class="mt-2 mb-2">
						{children.map((child, index) => (
							<li key={index} tabIndex={0} onClick={() => handleSelect(child)}>
								<div class="hover:bg-base-300 mr-2 ml-2 card">
									<span class="p-2">{child}</span>
								</div>
							</li>
						))}
					</div>
				</ul>
			)}
		</div>
	)
}
