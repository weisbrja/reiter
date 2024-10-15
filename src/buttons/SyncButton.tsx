import { useSattelContext } from '../components/Sattel'

// TODO: Rename this to SyncButton
export function SyncAllButton({children}: {children: string}) {
    const { startSattel } = useSattelContext()
    return (
        <button class="btn btn-primary" onClick={startSattel}>
			{children}
        </button>
    )
}
