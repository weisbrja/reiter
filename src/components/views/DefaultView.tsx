import { SyncAllButton } from '../../buttons/SyncButton'
import { SattelProgress, useSattelContext } from '../Sattel'
import Bar from '../Bar'
import SettingsButton from '../../buttons/SettingsButton'

export default function DefaultView({ show, onSettings}: { show: boolean, onSettings: () => void }) {
	const { isSattelRunning } = useSattelContext()

	return (
		<div class={show ? 'block' : 'hidden'}>
			<Bar>
				<h1 class="w-full text-2xl font-bold text-center">Reiter</h1>
			</Bar>
			<div class="p-4">
				{isSattelRunning ? (
					<SattelProgress />
				) : (
					<div class={"flex-1"}> 
						<SyncAllButton> Sync All </SyncAllButton>
						<SettingsButton onClick={onSettings}>Settings</SettingsButton>
					</div>
				)}
			</div>
		</div>
	)
}
