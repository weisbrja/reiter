import { Crawler } from "../../App";
import Bar from "../Bar";

export default function CrawlerView({ crawler, onBack }: { crawler: Crawler, onBack: () => void; }) {
	return <>
		<Bar>
			<button class="btn btn-error" onClick={onBack}>Back</button>
			<div class="flex-1 text-center">
				<h1 class="text-2xl font-bold">{crawler.name}</h1>
			</div>
		</Bar>
		<div class="p-4">
			<span>target = {crawler.target}</span>
		</div>
	</>;
}
