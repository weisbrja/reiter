import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { ProgressBars, ProgressBarChannelContextProvider, useProgressBarChannelContext } from "./ProgressBars";

type RequestSubject = "password" | "username" | "jsonArgs";

export default function SyncAll() {
	const [resetKey, setResetKey] = useState(0);

	const [runningSattel, setRunningSattel] = useState(false);

	function runSattel() {
		setRunningSattel(true);
	}

	function stopSattel() {
		setRunningSattel(false);
		emit("cancel");
		setResetKey(prevKey => prevKey + 1);
	}

	return (
		<div class="p-4">
			{!runningSattel
				? <button class="btn btn-primary" onClick={runSattel}>Sync</button>
				: <>
					<button class="btn btn-error mb-4" onClick={stopSattel}>Cancel</button>
					<ProgressBarChannelContextProvider key={resetKey}>
						<SattelRunner />
					</ProgressBarChannelContextProvider>
				</>
			}
		</div >
	);
}

function SattelRunner() {
	const progressBarEvent = useProgressBarChannelContext();
	const [crawler, setCrawler] = useState("");

	useEffect(() => {
		const request_unlisten = listen<RequestSubject>("request", event => {
			switch (event.payload) {
				case "jsonArgs":
					// run all crawlers
					emit("response", "{}");
					break;
				case "password":
				case "username":
					// TODO
					break;
			}
		});

		const crawl_unlisten = listen<string>("crawl", event => {
			setCrawler(event.payload);
		});

		invoke("run_sattel", { progressBarEvent });

		return () => {
			request_unlisten.then(unlisten => unlisten());
			crawl_unlisten.then(unlisten => unlisten());
		};
	}, []);

	return (
		<Crawling crawler={crawler} />
	);
}

function Crawling({ crawler }: { crawler: string }) {
	return <>
		<h1 class="mb-4 text-2xl font-bold">Crawling {crawler}</h1>
		<ProgressBars />
	</>;
}
