import { useEffect, useState } from "preact/hooks"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import "./main.css"
import DefaultView from "./components/views/DefaultView"
import Sidebar from "./components/Sidebar"
import SattelLoginHandler, { SattelProvider } from "./components/Sattel"
import CrawlerView from "./components/views/CrawlerView"

export type Config = {
	settings: Settings
	crawlers: Crawler[]
}

export type Settings = {
	workingDir: string
}

export type Crawler = {
	name: string
	target: string
	type: string
	auth: string
	videos: boolean
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function App() {
	const [configKey, setConfigKey] = useState(0)
	const [watchConfigKey, setWatchConfigKey] = useState(0)
	const [config, setConfig] = useState<Config | undefined>()
	const [crawlerName, setCrawlerName] = useState<string | null>(null)

	useEffect(() => {
		invoke("show_window")

		parseConfig()
		const configFileChangedUnlisten = listen("configFileChanged", (_) => {
			parseConfig()
		})

		return () => configFileChangedUnlisten.then((unlisten) => unlisten())
	}, [])

	useEffect(() => {
		watchConfig()
	}, [watchConfigKey])

	async function parseConfig() {
		try {
			const config = await invoke<Config>("parse_config")
			setConfig(config)
			setConfigKey((prevKey) => prevKey + 1)
		} catch (error) {
			console.error(error)
		}
	}

	async function watchConfig() {
		// TODO: apparently watch config never seems to exit, even on directory delete
		try {
			await invoke("watch_config")
		} catch (e) {
			console.error(e)
			await sleep(5000)
			setWatchConfigKey((prevKey) => prevKey + 1)
		}
	}

	return (
		<SattelProvider>
			<div class="flex">
				<Sidebar key={configKey} config={config} setCrawlerName={setCrawlerName} />
				<div class="w-full">
					{crawlerName !== null ? (
						<CrawlerView
							key={configKey + crawlerName}
							config={config}
							crawlerName={crawlerName}
							setCrawlerName={setCrawlerName}
						/>
					) : (
						<DefaultView key={configKey} config={config} />
					)}
				</div>
			</div>
			<SattelLoginHandler />
		</SattelProvider>
	)
}
