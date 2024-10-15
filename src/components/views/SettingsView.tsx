import { Config } from '../../App'
import Bar from '../Bar'

export default function SettingsView({ config, onBack }: { config: Config; onBack: () => void }) {
	return (
		<>
			<Bar>
				<button class="btn btn-error" onClick={onBack}>
					back
				</button>
				<h1 class="w-full text-2xl font-bold text-center">Settings</h1>
			</Bar>
			<div class="p-4">
				<div class="flex-1 mb-4">
					<div class="flex-1 mb-4">
						<label> work dir </label>
						<input type="text" value={config.working_dir} class="input input-bordered" id="ref_id" />
					</div>
				</div>
				<button class="btn btn-primary"> save </button>
			</div>
		</>
	)
}
