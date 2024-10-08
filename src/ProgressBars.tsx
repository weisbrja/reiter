import { useContext, useState, useEffect } from "preact/hooks";
import { createContext } from "preact";
import { Channel } from "@tauri-apps/api/core";
import { ReactNode } from "preact/compat";

type ProgressBarKind = "download" | "crawl";

type ProgressBarEvent =
	| { kind: "begin"; bar: ProgressBarKind, path: string }
	| { kind: "advance"; progress: number }
	| { kind: "setTotal"; total: number }
	| { kind: "done" };

export interface ProgressBarMsg {
	id: number;
	event: ProgressBarEvent;
}

export interface ProgressBar {
	bar: ProgressBarKind,
	progress: number,
	total: number | null,
	path: string,
}

export const ProgressBarChannelContext = createContext<Channel<ProgressBarMsg> | undefined>(undefined);

export function useProgressBarChannelContext() {
	const context = useContext(ProgressBarChannelContext);
	if (context === undefined) {
		throw new Error("useProgressBarChannelContext must be used with a ProgressBarChannelContextProvider");
	}
	return context;
}

export function ProgressBarChannelContextProvider({ children }: { children: ReactNode }) {
	const [progressBarEvent] = useState(new Channel());
	return <ProgressBarChannelContext.Provider value={progressBarEvent}>
		{children}
	</ProgressBarChannelContext.Provider>;
}

export function ProgressBars() {
	const progressBarEvent = useContext(ProgressBarChannelContext);
	const [finished, setFinished] = useState<Map<number, ProgressBar>>(new Map());
	const [running, setRunning] = useState<Map<number, ProgressBar>>(new Map());

	useEffect(() => {
		return () => {
			setRunning(new Map());
			setFinished(new Map());
		};
	}, []);

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
		<div tabIndex={0} class="collapse collapse-arrow bg-base-300 mb-4">
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

export function RunningProgressBar({ bar, progress, total, path }: ProgressBar) {
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

export function FinishedDownloadBar({ progress, total, path }: DownloadBarProps) {
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
			<span class="flex-grow">{path}</span>
			<span class="ml-4 whitespace-nowrap">
				<span class="font-bold">{formatBytes(progress)}</span>
				{total !== null && (<>
					<span> / </span>
					<span class="font-bold">{formatBytes(total)}</span>
				</>)}
			</span>
		</div>
	);
}
