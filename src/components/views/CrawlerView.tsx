import { Config, Crawler } from "../../App"
import { SyncButton } from "../../buttons/SyncButton"
import EditCrawlerForm from "../../forms/EditCrawlerform"
import Bar from "../Bar"

export default function CrawlerView({
	config,
	crawler,
	onBack,
}: {
	config: Config | undefined
	crawler: Crawler
	onBack: () => void
}) {
	return (
		<>
			<Bar>
				<button class="btn btn-error" onClick={onBack}>
					Back
				</button>
				<h1 class="w-full text-2xl font-bold text-center">Crawler {crawler.name}</h1>
			</Bar>
			<div class="p-4">
				<SyncButton crawler={crawler.name} />
				<h2 class="w-full text-xl font-medium text-center">Settings</h2>
				<EditCrawlerForm config={config} crawler={crawler} onSubmit={(_crawler) => {}} />
			</div>
		</>
	)
}
