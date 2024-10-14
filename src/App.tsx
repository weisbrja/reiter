import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css"
import DefaultView from "./components/views/DefaultView";
import CrawlerView from "./components/views/CrawlerView";
import Sidebar from "./components/Sidebar";
import SattelLoginHandler, { SattelProvider } from "./components/Sattel";

export interface Config {
	working_dir: string;
	crawlers: Crawler[];
}

export interface Crawler {
	name: string;
	target: string;
	videos: boolean;
}

export default function App() {
	const [hasConfigChanged, setConfigChanged] = useState(true);
	const [config, setConfig] = useState<Config | undefined>();
	const [crawlerName, setCrawlerName] = useState<string | null>(null);

	useEffect(() => {
		invoke("show_window");

		const configFileChangedUnlisten = listen("configFileChanged", _ => {
			console.error("config changed");
			setConfigChanged(true);
		});

		invoke("watch_config").catch(_ => { /* already watching config */ });

		return () => configFileChangedUnlisten.then(unlisten => unlisten());
	}, []);

	useEffect(() => {
		if (hasConfigChanged) {
			invoke<Config>("parse_config")
				.then(config => setConfig(config))
				.catch(error => console.error(error));
			setConfigChanged(false);
		}
	}, [hasConfigChanged]);

	const crawler = config?.crawlers.find(crawler => crawler.name === crawlerName);

	return <div class="flex">
		<Sidebar config={config} setCrawlerName={setCrawlerName} />
		<SattelProvider>
			<div class="w-full">
				{crawler &&
					<CrawlerView
						crawler={crawler}
						onBack={() => setCrawlerName(null)}
					/>
				}
				<DefaultView show={crawler === undefined} />
			</div>
			<SattelLoginHandler />
		</SattelProvider>
	</div>;
}
