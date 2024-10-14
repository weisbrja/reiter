import { useState, useEffect } from "preact/hooks";
import { useSattelContext } from "./Sattel";

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

interface ProgressBar {
	bar: ProgressBarKind,
	progress: number,
	total: number | null,
	path: string,
}

export function ProgressBars() {
	const { progressBarMsgs } = useSattelContext();
	const [finished, setFinished] = useState<Map<number, ProgressBar>>(new Map());
	const [running, setRunning] = useState<Map<number, ProgressBar>>(new Map());

	useEffect(() => {
		progressBarMsgs.onmessage = message => {
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
						// FIXME: fix this !
						if (prevRunning.get(id)!.bar === "download") {
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

		return () => {
			setRunning(new Map());
			setFinished(new Map());
		};
	}, []);

	const runningProgressBars = Array.from(running.entries()).map(([id, props]) => (
		<RunningProgressBar key={id} {...props} />
	));

	const finishedDownloadBars = Array.from(finished.entries()).map(([id, props]) => (
		<FinishedDownloadBar key={id} {...props} />
	));

	return <>
		<div tabIndex={0} class="collapse collapse-arrow bg-base-300 mb-4">
			<input type="checkbox" class="peer" />
			<div class="collapse-title checked: text-lg font-medium">Finished downloads</div>
			<div
				class="collapse-content">
				{finishedDownloadBars}
			</div>
		</div>
		{runningProgressBars}
	</>;
}

export function RunningProgressBar(props: ProgressBar) {
	return (
		<div class="mb-4">
			{props.bar == "crawl"
				? <CrawlBar path={props.path} />
				: <DownloadBar {...props} />
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

function DownloadBar(props: DownloadBarProps) {
	return <>
		{props.total === null
			? <progress class="progress progress-primary"></progress>
			: <progress class="progress progress-primary" value={props.progress} max={props.total}></progress>
		}
		<DownloadBarText {...props} />
	</>;
}

export function FinishedDownloadBar(props: DownloadBarProps) {
	return (
		<div class="mb-4">
			<progress class="progress progress-success" value="100" max="100"></progress>
			<DownloadBarText {...props} />
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
