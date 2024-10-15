import { Crawler } from '../../App'
import Bar from '../Bar'

export default function EditCrawlerView({ crawler, onBack }: { crawler: Crawler; onBack: () => void }) {
	return (
		<>
			<Bar>
				<button class="btn btn-error" onClick={onBack}>
					back
				</button>
				<h1 class="w-full text-2xl font-bold text-center">Edit Crawler {crawler.name}</h1>
			</Bar>
			<div class="p-4">
				<div class="flex-1 mb-4">
					<div class="flex-1 mb-4">
						<label> crawler name </label>
						<input type="text" value={crawler.name} class="input input-bordered" id="name" />
					</div>
					<div class="flex-1 mb-4">
						<label> ref_id </label>
						<input type="text" value={crawler.target} class="input input-bordered" id="ref_id" />
					</div>
					<div class="flex">
						<label for="videos"> videos </label>
						<input type="checkbox" class="checkbox" id="videos"/>
					</div>
				</div>
				<button class="btn btn-primary"> save </button>
			</div>
		</>
	)
}
