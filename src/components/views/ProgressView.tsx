import { useSattelContext } from "../Sattel"
import Bar from "../Bar"
import { ProgressBars } from "../ProgressBars"

export default function ProgressView() {
	const { cancelSattel, currentCrawler } = useSattelContext()

	return (
		<>
			<Bar>
				<h1 class="w-full text-2xl font-bold text-center">Syncing</h1>
			</Bar>
			<div class="p-4">
				<div class="flex items-center justify-between mb-4">
					<button class="btn btn-error mr-4" onClick={cancelSattel}>
						Cancel
					</button>
					{currentCrawler ? (
						<span class="font-bold">Crawling {currentCrawler}</span>
					) : (
						<span class="loading loading-dots"></span>
					)}
				</div>
				<ProgressBars />
			</div>
		</>
	)
}
