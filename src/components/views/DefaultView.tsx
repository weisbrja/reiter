import { Config } from "../../App"
import { useSattelContext } from "../Sattel"
import ProgressView from "./ProgressView"
import { SettingsView } from "./SettingsView"

export default function DefaultView({ config }: { config: Config | undefined }) {
	const { isSattelRunning } = useSattelContext()

	return isSattelRunning ? <ProgressView /> : <SettingsView config={config} />
}
