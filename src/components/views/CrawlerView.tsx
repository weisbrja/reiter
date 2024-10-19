import { invoke } from "@tauri-apps/api/core"
import { Config } from "../../App"
import { SyncButton } from "../../buttons/SyncButton"
import EditCrawlerForm from "../../forms/EditCrawlerform"
import Bar from "../Bar"
import { FormErrorContext } from "../Popup"
import { useState } from "preact/hooks"

export default function CrawlerView({
	config,
	crawlerName,
	setCrawlerName,
	onBack,
}: {
	config: Config | undefined
	crawlerName: string
	setCrawlerName: (crawlerName: string) => void
	onBack: () => void
}) {
	const crawler = config?.crawlers.find((crawler) => crawler.name === crawlerName)

	const [error, setError] = useState<string | null>(null)
	const [resetKey, setResetKey] = useState(0)

	return (
		<>
			<Bar>
				<button class="btn btn-error" onClick={onBack}>
					Back
				</button>
				<h1 class="w-full text-2xl font-bold text-center">{crawlerName}</h1>
				<div class="total right-2">
					<SyncButton crawler={crawlerName} />
				</div>
			</Bar>
			<div class="p-4">
				{error && <p class="text-error mb-2">{error}</p>}
				<FormErrorContext.Provider value={{ setError, onCancel: () => setResetKey((prevKey) => prevKey + 1) }}>
					<EditCrawlerForm
						key={resetKey}
						crawler={crawler}
						onSubmit={(newCrawler) => {
							setCrawlerName(newCrawler.name)
							invoke("save_crawler", { oldCrawlerName: crawlerName, newCrawler }).catch((error) => console.error(error))
						}}
					/>
				</FormErrorContext.Provider>
			</div>
		</>
	)
}
