import { useEffect, useState } from "preact/hooks"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import "./main.css"
import DefaultView from "./components/views/DefaultView"
import Sidebar from "./components/Sidebar"
import SattelLoginHandler, { SattelProvider } from "./components/Sattel"
import CrawlerView from "./components/views/CrawlerView"
import { FormErrorContext } from "./components/Popup"

export interface Config {
	settings: Settings
	crawlers: Crawler[]
}

export interface Settings {
	workingDir: string
}

export interface Crawler {
	name: string
	target: string
	type: string
	videos: boolean
}

export default function App() {
	const [configKey, setConfigKey] = useState(0)
	const [config, setConfig] = useState<Config | undefined>()
	const [crawlerName, setCrawlerName] = useState<string | null>(null)

	useEffect(() => {
		invoke("show_window")
		parseConfig()

		const configFileChangedUnlisten = listen("configFileChanged", (_) => {
			parseConfig()
		})

		invoke("watch_config").catch((_) => {
			/* already watching config */
		})

		return () => configFileChangedUnlisten.then((unlisten) => unlisten())
	}, [])

	function parseConfig() {
		console.info("parse config")
		invoke<Config>("parse_config")
			.then((config) => {
				setConfig(config)
				setConfigKey((prevKey) => prevKey + 1)
			})
			.catch((error) => console.error(error))
	}

	return (
		<SattelProvider>
			<SattelLoginHandler />
			<div class="flex">
				<Sidebar key={configKey} config={config} setCrawlerName={setCrawlerName} />
				<div class="w-full">
					{crawlerName !== null ? (
						<CrawlerView
							key={configKey}
							config={config}
							crawlerName={crawlerName}
							setCrawlerName={setCrawlerName}
							onBack={() => setCrawlerName(null)}
						/>
					) : (
						<DefaultView key={configKey} config={config} />
					)}
				</div>
			</div>
		</SattelProvider>
	)
}
