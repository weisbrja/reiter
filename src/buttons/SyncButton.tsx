import { useSattelContext } from "../components/Sattel";


export function SyncAllButton() {
	const { startSattel } = useSattelContext();
	return <button class="btn btn-primary" onClick={startSattel}>Sync All</button>;
}
