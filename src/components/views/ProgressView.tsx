import { useSattelContext } from "../Sattel"
import Bar from "../Bar"
import { ProgressBars } from "../ProgressBars"

export default function ProgressView() {
	const { cancelSattel, currentCrawler } = useSattelContext()

	return (
		<>
			<Bar>
				<h1 class="w-full text-2xl font-bold text-center">Syncing</h1>
				<button class="absolute right-2 btn btn-error" onClick={cancelSattel}>
					Cancel
				</button>
			</Bar>
			<div class="p-4">
				<ProgressBars />
			</div>
		</>
	)
}
