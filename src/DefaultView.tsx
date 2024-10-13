import { SattelProgress, useSattelContext } from "./Sattel";
import Bar from "./Bar";

export default function DefaultView() {
	// const [resetKey, setResetKey] = useState(0);

	const { isSattelRunning } = useSattelContext();

	return <>
		<Bar>
			<h1 class="w-full text-2xl font-bold text-center">Reiter</h1>
		</Bar>
		<div class="p-4">
			{isSattelRunning
				? <SattelProgress />
				: <SyncAllButton />
			}
		</div >
	</>;
}

function SyncAllButton() {
	const { startSattel } = useSattelContext();
	return <button class="btn btn-primary" onClick={startSattel}>Sync All</button>;
}
