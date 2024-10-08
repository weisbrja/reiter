interface SidebarItem {
	label: string;
}

const sidebarItems: SidebarItem[] = [
	{ label: 'Lineare Algebra 1' },
	{ label: 'Analysis 2' },
	{ label: 'Grundbegriffe der Informatik' },
];

export default function Sidebar() {
	return (
		<div class="h-screen w-1/4 min-w-60">
			<nav>
				{sidebarItems.map((item, index) => (
					<div key={index} class="flex items-center p-4 hover:bg-base-300">
						<span class="text-lg">{item.label}</span>
					</div>
				))}
				<div class="flex items-center text-center justify-center p-4  hover:bg-base-300">
					+
				</div>
			</nav>
		</div>
	);
}
