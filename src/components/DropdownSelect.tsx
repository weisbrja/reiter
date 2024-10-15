import { useState } from 'preact/hooks'

export default function DropdownSelect({
    onSelect,
    children,
}: {
    onSelect: (selected: string) => void
    children: string[]
}) {
    const [selected, setSelected] = useState<string>()
    const [dropdownOpen, setDropdownOpen] = useState(false)

    function toggleDropdown() {
        setDropdownOpen(!dropdownOpen)
    }

    function handleSelect(selected: string) {
        setSelected(selected)
        onSelect(selected)
        toggleDropdown()
    }

	// TODO: something with tabIndex
	// FIXME: there's a random empty string at the end of child it seems
    return (
        <div class="mb-4">
            <div class="relative w-full">
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
                {dropdownOpen && (
                    <ul class="absolute mt-2 w-full rounded-box bg-base-100 z-10">
                        <div class="mt-2 mb-2">
                            {children.map((child, index) => (
                                <li key={index} onClick={() => handleSelect(child)}>
                                    <div class="hover:bg-base-300 mr-2 ml-2 card">
                                        <span class="p-2">{child}</span>
                                    </div>
                                </li>
                            ))}
                        </div>
                    </ul>
                )}
            </div>
        </div>
    )
}
