import { useEffect, useState } from "preact/hooks"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import "./main.css"
import DefaultView from "./components/views/DefaultView"
import Sidebar from "./components/Sidebar"
import SattelLoginHandler, { SattelProvider } from "./components/Sattel"
import CrawlerView from "./components/views/CrawlerView"

export interface Config {
	workingDir: string
	crawlers: Crawler[]
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

		const configFileChangedUnlisten = listen("configFileChanged", (_) => {
			console.warn("config changed")
			setConfigKey((prevKey) => prevKey + 1)
		})

		invoke("watch_config").catch((_) => {
			/* already watching config */
		})

		return () => configFileChangedUnlisten.then((unlisten) => unlisten())
	}, [])

	useEffect(() => {
		console.log("loading config")

		invoke<Config>("parse_config")
			.then((config) => {
				setConfig(config)
			})
			.catch((error) => console.error(error))
	}, [configKey])

	const crawler = config?.crawlers.find((crawler) => crawler.name === crawlerName)

	return (
		<SattelProvider>
			<SattelLoginHandler />
			<div class="flex">
				<Sidebar key={configKey} config={config} setCrawlerName={setCrawlerName} />
				<div class="w-full">
					{crawler ? (
						<CrawlerView
							key={configKey + "#" + crawlerName}
							config={config}
							crawler={crawler}
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
