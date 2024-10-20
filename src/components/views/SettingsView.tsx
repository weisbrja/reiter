import { invoke } from "@tauri-apps/api/core"
import { Config } from "../../App"
import { SyncButton } from "../../buttons/SyncButton"
import SettingsForm from "../../forms/SettingsForm"
import Bar from "../Bar"
import Theme from "../Theme"

export function SettingsView({ config }: { config: Config | undefined }) {
	return (
		<>
			<Bar>
				<h1 class="w-full text-2xl font-bold text-center">Reiter</h1>
				<div class="absolute right-2 flex gap-x-4">
					<Theme />
					<SyncButton crawler={null} />
				</div>
			</Bar>
			<div class="p-4">
				<SettingsForm
					config={config}
					onSubmit={(settings) => {
						invoke("save_settings", { settings }).catch((error) => console.error(error))
					}}
				/>
			</div>
		</>
	)
}
