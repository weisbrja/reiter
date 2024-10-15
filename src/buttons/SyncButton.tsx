import { useSattelContext } from "../components/Sattel"

export function SyncButton({ crawler }: { crawler: string | null }) {
	const { queueSattel } = useSattelContext()
	return (
		<button class="btn btn-primary" onClick={() => queueSattel(crawler)}>
			{crawler ? "Sync" : "Sync All"}
		</button>
	)
}
