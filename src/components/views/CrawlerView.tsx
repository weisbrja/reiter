import { invoke } from "@tauri-apps/api/core"
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
				<h1 class="w-full text-2xl font-bold text-center">{crawler.name}</h1>
				<div class="total right-2">
					<SyncButton crawler={crawler.name} />
				</div>
			</Bar>
			<div class="p-4">
				<EditCrawlerForm
					config={config}
					crawler={crawler}
					onSubmit={(crawler) => {
						invoke("save_crawler", { crawler }).catch((error) => console.error(error))
					}}
				/>
			</div>
		</>
	)
}
