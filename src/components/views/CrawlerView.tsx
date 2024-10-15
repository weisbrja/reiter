import { Crawler } from '../../App'
import SettingsButton from '../../buttons/SettingsButton'
import { SyncAllButton } from '../../buttons/SyncButton'
import Bar from '../Bar'

export default function CrawlerView({
	crawler,
	onBack,
	onSettings,
}: {
	crawler: Crawler
	onBack: () => void
	onSettings: () => void
}) {
	return (
		<>
			<Bar>
				<button class="btn btn-error" onClick={onBack}>
					Back
				</button>
				<div class="flex-1 text-center">
					<h1 class="text-2xl font-bold">{crawler.name}</h1>
				</div>
			</Bar>
			<div class="flex-1 space-between p-4">
				{/* FIXME: add sync crawler button */}
				<SyncAllButton>Sync All</SyncAllButton>
				<SettingsButton onClick={onSettings}>Settings</SettingsButton>
			</div>
		</>
	)
}
