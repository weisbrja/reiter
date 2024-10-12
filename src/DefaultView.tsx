import { useState } from "preact/hooks";
import SattelManager from "./SattelManager";
import { ProgressBarChannelContextProvider } from "./ProgressBars";
import Bar from "./Bar";

export default function DefaultView() {
	return <>
		<Bar>
			<h1 class="w-full text-2xl font-bold text-center">Reiter</h1>
		</Bar>
		<div class="p-4">
			<SyncAllButton />
		</div>
	</>;
}

export function SyncAllButton() {
	const [resetKey, setResetKey] = useState(0);

	const [isSattelRunning, setSattelRunning] = useState(false);

	return <>
		{isSattelRunning
			? <ProgressBarChannelContextProvider key={resetKey}>
				<SattelManager onCancel={() => {
					setResetKey(prevKey => prevKey + 1);
					setSattelRunning(false);
				}} />
			</ProgressBarChannelContextProvider>
			: <button class="btn btn-primary" onClick={() => setSattelRunning(true)}>Sync All</button>
		}
	</>;
}
