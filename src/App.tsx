import { useEffect, useState } from 'preact/hooks'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import './App.css'
import DefaultView from './components/views/DefaultView'
import CrawlerView from './components/views/CrawlerView'
import Sidebar from './components/Sidebar'
import SattelLoginHandler, { SattelProvider } from './components/Sattel'
import SettingsView from './components/views/SettingsView'
import EditCrawlerView from './components/views/EditCrawlerView'

export interface Config {
	working_dir: string
	crawlers: Crawler[]
}

export interface Crawler {
	name: string
	target: string
	videos: boolean
}

export default function App() {
	const [hasConfigChanged, setConfigChanged] = useState(true)
	const [config, setConfig] = useState<Config | undefined>()
	const [crawlerName, setCrawlerName] = useState<string | null>(null)

	const [showSettings, setShowSettings] = useState(false)

	useEffect(() => {
		invoke('show_window')

		const configFileChangedUnlisten = listen('configFileChanged', (_) => {
			console.error('config changed')
			setConfigChanged(true)
		})

		invoke('watch_config').catch((_) => {
			/* already watching config */
		})

		return () => configFileChangedUnlisten.then((unlisten) => unlisten())
	}, [])

	useEffect(() => {
		if (hasConfigChanged) {
			invoke<Config>('parse_config')
				.then((config) => setConfig(config))
				.catch((error) => console.error(error))
			setConfigChanged(false)
		}
	}, [hasConfigChanged])

	const crawler = config?.crawlers.find((crawler) => crawler.name === crawlerName)

	return (
		<div class="flex">
			<Sidebar config={config} setCrawlerName={setCrawlerName} />
			<SattelProvider>
				<div class="w-full">
					{crawler && !showSettings && (
						<CrawlerView
							crawler={crawler}
							onBack={() => setCrawlerName(null)}
							onSettings={() => setShowSettings(true)}
						/>
					)}
					{crawler && showSettings && (
						<EditCrawlerView crawler={crawler} onBack={() => setShowSettings(false)} />
					)}
					{!crawler && showSettings && <SettingsView onBack={() => setShowSettings(false)} />}
					{!crawler && !showSettings && (
						<DefaultView show={crawler === undefined} onSettings={() => setShowSettings(true)} />
					)}
				</div>
				<SattelLoginHandler />
			</SattelProvider>
		</div>
	)
}
