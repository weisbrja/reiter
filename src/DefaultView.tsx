import { SattelProgress, useSattelContext } from "./Sattel";
import Bar from "./Bar";

export default function DefaultView({ show }: { show: boolean }) {
	const { isSattelRunning } = useSattelContext();

	return <div class={show ? "block" : "hidden"}>
		<Bar>
			<h1 class="w-full text-2xl font-bold text-center">Reiter</h1>
		</Bar>
		<div class="p-4">
			{isSattelRunning
				? <SattelProgress />
				: <SyncAllButton />
			}
		</div >
	</div>;
}

function SyncAllButton() {
	const { startSattel } = useSattelContext();
	return <button class="btn btn-primary" onClick={startSattel}>Sync All</button>;
}
