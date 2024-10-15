import { Config } from "../../App"
import { SyncButton } from "../../buttons/SyncButton"
import SettingsForm from "../../forms/SettingsForm"
import Bar from "../Bar"

export function SettingsView({ config }: { config: Config | undefined }) {
	return (
		<>
			<Bar>
				<h1 class="w-full text-2xl font-bold text-center">Reiter</h1>
			</Bar>
			<div class="p-4">
				<SyncButton crawler={null} />
				<h2 class="w-full text-xl font-medium text-center">Settings</h2>
				<SettingsForm config={config} onSubmit={() => {}} />
			</div>
		</>
	)
}
