import { useContext, useEffect, useState } from "preact/hooks";
import { invoke, Channel } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { createContext } from "preact";

type RequestSubject = "password" | "username" | "jsonArgs";

type ProgressBarKind = "download" | "crawl";

type ProgressBarEvent =
	| { kind: "begin"; bar: ProgressBarKind, path: string }
	| { kind: "advance"; progress: number }
	| { kind: "setTotal"; total: number }
	| { kind: "done" };

interface ProgressBarMsg {
	id: number;
	event: ProgressBarEvent;
}

interface ProgressBar {
	bar: ProgressBarKind,
	progress: number,
	total: number | null,
	path: string,
}

const ProgressBarChannelContext = createContext<Channel<ProgressBarMsg>>(new Channel<ProgressBarMsg>());

export default function SyncAll() {
	const [progressBarEvent] = useState(new Channel<ProgressBarMsg>());

	useEffect(() => {
		const unlisten = listen<RequestSubject>("request", event => {
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
		return () => unlisten.then(unlisten => unlisten());
	}, []);

	return (
		<ProgressBarChannelContext.Provider value={progressBarEvent}>
			<SyncButton />
		</ProgressBarChannelContext.Provider>
	);
}

export function SyncButton() {
	const [runSattel, setRunSattel] = useState(false);
	const progressBarEvent = useContext(ProgressBarChannelContext);

	useEffect(() => {
		if (runSattel) {
			invoke("run_sattel", { progressBarEvent })
				.catch(error => console.error("sattel error:", error))
		}
	}, [runSattel]);

	return <div class="p-4">
		{!runSattel
			? <button class="btn btn-primary" onClick={() => setRunSattel(true)}>Sync</button>
			: <>
				<button class="btn btn-error mb-4" onClick={() => {
					setRunSattel(false);
					emit("cancel");
				}}>Cancel</button>
				<Crawling />
			</>
		}
	</div>;
}

function Crawling() {
	const [crawler, setCrawler] = useState<string>("");

	useEffect(() => {
		listen<string>("crawl", event => {
			setCrawler(event.payload);
		});
	});

	return <>
		<h1 class="text-2xl font-bold">Crawling {crawler}</h1>
		<ProgressBars />
	</>;
}

function ProgressBars() {
	const progressBarEvent = useContext(ProgressBarChannelContext);
	const [finished, setFinished] = useState<Map<number, ProgressBar>>(new Map());
	const [running, setRunning] = useState<Map<number, ProgressBar>>(new Map());

	useEffect(() => {
		progressBarEvent.onmessage = message => {
			const id = message.id;
			const event = message.event;
			switch (event.kind) {
				case "begin":
					setRunning(prevRunning => {
						const nowRunning = new Map(prevRunning);
						nowRunning.set(id, { bar: event.bar, path: event.path, progress: 0, total: null });
						return nowRunning;
					});
					break;
				case "advance":
					setRunning(prevRunning => {
						const nowRunning = new Map(prevRunning);
						nowRunning.set(id, {
							...prevRunning.get(id)!,
							progress: event.progress,
						});
						return nowRunning;
					});
					break;
				case "setTotal":
					setRunning(prevRunning => {
						const nowRunning = new Map(prevRunning);
						nowRunning.set(id, {
							...prevRunning.get(id)!,
							total: event.total,
						});
						return nowRunning;
					});
					break;
				case "done":
					setRunning(prevRunning => {
						if (prevRunning.get(id)!.bar == "download") {
							setFinished(prevFinished => {
								const nowFinished = new Map(prevFinished);
								nowFinished.set(id, prevRunning.get(id)!);
								return nowFinished;
							});
						}

						const nowRunning = new Map(prevRunning);
						nowRunning.delete(id);
						return nowRunning;
					});
					break;
			}
		};
	}, []);

	const runningProgressBars = Array.from(running.entries()).map(([id, { bar, progress, total, path }]) => (
		<RunningProgressBar key={id} bar={bar} progress={progress} total={total} path={path} />
	));

	const finishedDownloadBars = Array.from(finished.entries()).map(([id, { progress, total, path }]) => (
		<FinishedDownloadBar key={id} progress={progress} total={total} path={path} />
	));

	return <>
		<div tabIndex={0} class="collapse collapse-arrow bg-base-300 mb-2">
			<input type="checkbox" class="peer" />
			<div class="collapse-title checked: text-xl font-medium">Finished downloads</div>
			<div
				class="collapse-content">
				{finishedDownloadBars}
			</div>
		</div>
		{runningProgressBars}
	</>;
}

function RunningProgressBar({ bar, progress, total, path }: ProgressBar) {
	return (
		<div class="mb-4">
			{bar == "crawl"
				? <CrawlBar path={path} />
				: <DownloadBar progress={progress} total={total} path={path} />
			}
		</div >
	);
}

function formatBytes(bytes: number) {
	if (bytes == 1) return "1 byte";
	if (bytes < 1024) return `${bytes} bytes`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type CrawlBarProps = { path: string };

function CrawlBar({ path }: CrawlBarProps) {
	return <>
		<progress class="progress progress-secondary"></progress>
		<CrawlBarText path={path} />
	</>;
}

function CrawlBarText({ path }: CrawlBarProps) {
	return (
		<div class="flex justify-between">
			<span class="">{path}</span>
			<span class="font-bold">Crawling</span>
		</div>
	);
}

type DownloadBarProps = { progress: number, total: number | null, path: string };

function DownloadBar({ progress, total, path }: DownloadBarProps) {
	return <>
		{total === null
			? <progress class="progress progress-primary"></progress>
			: <progress class="progress progress-primary" value={progress} max={total}></progress>
		}
		<DownloadBarText progress={progress} total={total} path={path} />
	</>;
}

function FinishedDownloadBar({ progress, total, path }: DownloadBarProps) {
	return (
		<div class="mb-4">
			<progress class="progress progress-success" value="100" max="100"></progress>
			<DownloadBarText progress={progress} total={total} path={path} />
		</div>
	);
}

function DownloadBarText({ progress, total, path }: DownloadBarProps) {
	return (
		<div class="flex justify-between">
			<span>{path}</span>
			<span class="font-bold">
				{formatBytes(progress)}
				{total !== null && (<>
					<span> / </span>
					<span class="font-bold">{formatBytes(total)}</span>
				</>)}
			</span>
		</div>
	);
}
