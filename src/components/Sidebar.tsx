import { Config } from '../App'
import AddCrawlerButton from '../buttons/AddCrawlerButton'

interface SidebarProps {
    config: Config | undefined
    setCrawlerName: (name: string) => void
}

export default function Sidebar({ config, setCrawlerName }: SidebarProps) {
    // TODO: improve with <nav> maybe?
    return (
        <div class="h-screen w-1/4 min-w-60 bg-base-200">
            {config?.crawlers.map((item, index) => (
                <div
                    key={index}
                    class="flex items-center p-4 hover:bg-base-300 cursor-pointer"
                    onClick={() => setCrawlerName(item.name)}
                >
                    <span class="text-lg">{item.name}</span>
                </div>
            ))}
            <AddCrawlerButton />
        </div>
    )
}
