import { Config } from "../App"
import AddCrawlerButton from "../buttons/AddCrawlerButton"

interface SidebarProps {
	config: Config | undefined
	setCrawlerName: (name: string) => void
}

export default function Sidebar({ config, setCrawlerName }: SidebarProps) {
	// TODO: improve with <nav> maybe?
	return (
		<div class="flex flex-col h-screen w-1/4 min-w-60 bg-base-200">
			{config?.crawlers.map((crawler, index) => (
				<div class="p-2">
					<div
						key={index}
						class="p-2 flex items-center hover:bg-base-300 cursor-pointer rounded-box"
						onClick={() => setCrawlerName(crawler.name)}
					>
						<span class="text-lg">{crawler.name}</span>
					</div>
				</div>
			))}
			<AddCrawlerButton />
		</div>
	)
}
