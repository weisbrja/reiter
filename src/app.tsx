import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import "./app.css"

export default function App() {
	useEffect(() => { invoke("show_window"); }, []);

	return (
		<ProgressBars />
	);
}

type ProgressBarEvent =
	| { kind: "begin"; path: string }
	| { kind: "advance"; progress: number }
	| { kind: "setTotal"; total: number }
	| { kind: "done" };

interface ProgressBarMessage {
	id: number;
	event: ProgressBarEvent;
}

interface ProgressBar {
	progress: number,
	total: number | null,
	path: string,
}

export function ProgressBars() {
	const [finished, setFinished] = useState<Map<number, ProgressBar>>(new Map());
	const [running, setRunning] = useState<Map<number, ProgressBar>>(new Map());

	useEffect(() => {
		invoke('run_sattel', { jsonArgs: "{}" })
			.then(() => console.log('sattel executed'))
			.catch(error => console.error('sattel error', error))
	}, []);

	useEffect(() => {
		const unlistens = [
			listen('crawl', event => {
				console.log('crawl:', event);
			}),
			listen<ProgressBarMessage>('downloadBar', e => {
				console.log('downloadBar:', e);
				const message = e.payload;
				const id = message.id;
				const event = message.event;
				switch (event.kind) {
					case "begin":
						setRunning(prevRunning => {
							const nowRunning = new Map(prevRunning);
							nowRunning.set(id, { path: event.path, progress: 0, total: null });
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
							setFinished(prevFinished => {
								const nowFinished = new Map(prevFinished);
								nowFinished.set(id, prevRunning.get(id)!);
								return nowFinished;
							});

							const nowRunning = new Map(prevRunning);
							nowRunning.delete(id);
							return nowRunning;
						});
						break;
				}
			}),
			// listen<ProgressBarMessage>('crawlBar', event => {
			// 	console.log('event received:', event)
			// 	setRunning(prev => );
			// })
		];

		return () => {
			unlistens.map(unlisten => unlisten.then(unlisten => unlisten()));
		};
	}, []);

	const runningProgressBars = Array.from(running.entries()).map(([id, { progress, total, path }]) => (
		<ProgressBar key={id} progress={progress} total={total} path={path} />
	));

	const finishedProgressBars = Array.from(finished.entries()).map(([id, { progress, total, path }]) => (
		<FinishedProgressBar key={id} progress={progress} total={total} path={path} />
	));

	return (
		<div class="p-4">
			<div tabIndex={0} class="collapse collapse-arrow bg-base-300 mb-2">
				<input type="checkbox" class="peer" />
				<div class="collapse-title checked: text-xl font-bold">Finished downloads</div>
				<div
					class="collapse-content">
					{finishedProgressBars}
				</div>
			</div>
			{runningProgressBars}
		</div>
	);
}

function formatBytes(bytes: number) {
	if (bytes == 1) return "1 byte";
	if (bytes < 1024) return `${bytes} bytes`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ProgressBar({ progress, total, path }: ProgressBar) {
	return (
		<div class="mb-4">
			{total === null
				? <progress class="progress progress-primary"></progress>
				: <progress class="progress progress-primary" value={progress} max={total}></progress>
			}
			<span>{path}</span>
			<Size size={progress} />
		</div >
	);
}

function FinishedProgressBar({ progress, path }: ProgressBar) {
	return (
		<div class="mb-4">
			<progress class="progress progress-success" value="100" max="100"></progress>
			<span>{path}</span>
			<Size size={progress} />
		</div>
	);
}

function Size({ size }: { size: number }) {
	return <span class="ml-4 font-bold">{formatBytes(size)}</span>;
}
