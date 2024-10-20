import { useSattelContext } from "./Sattel"

type ProgressBarKind = "download" | "crawl"

type ProgressBarEvent =
	| { kind: "begin"; bar: ProgressBarKind; path: string }
	| { kind: "advance"; progress: number }
	| { kind: "setTotal"; total: number }
	| { kind: "done" }

export type ProgressBarMsg = {
	id: number
	event: ProgressBarEvent
}

export type ProgressBar = {
	bar: ProgressBarKind
	progress: number
	total: number | null
	path: string
}

export function ProgressBars() {
	const { finishedProgressBars, runningProgressBars, currentCrawler } = useSattelContext()

	const running = Array.from(runningProgressBars.entries()).map(([id, props]) => (
		<RunningProgressBar key={id} {...props} />
	))

	const finished = Array.from(finishedProgressBars.entries()).map(([id, props]) => (
		<FinishedDownloadBar key={id} {...props} />
	))

	return (
		<>
			<div tabIndex={0} class="collapse collapse-arrow bg-base-300 mb-8">
				<input type="checkbox" class="peer" />
				<div class="collapse-title checked: text-lg font-medium">Finished downloads</div>
				<div class="collapse-content">{finished}</div>
			</div>
			<div class="flex items-center justify-between mb-6">
				{currentCrawler ? (
					<span class="w-full text-lg text-center font-bold">Crawling {currentCrawler}</span>
				) : (
					<span class="loading loading-dots"></span>
				)}
			</div>
			{running}
		</>
	)
}

export function RunningProgressBar(props: ProgressBar) {
	return <div class="mb-4">{props.bar == "crawl" ? <CrawlBar path={props.path} /> : <DownloadBar {...props} />}</div>
}

function formatBytes(bytes: number) {
	if (bytes == 1) return "1 byte"
	if (bytes < 1024) return `${bytes} bytes`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

type CrawlBarProps = { path: string }

function CrawlBar({ path }: CrawlBarProps) {
	return (
		<>
			<progress class="progress progress-secondary"></progress>
			<CrawlBarText path={path} />
		</>
	)
}

function CrawlBarText({ path }: CrawlBarProps) {
	return (
		<div class="flex justify-between">
			<span class="">{path}</span>
			<span class="font-bold">Crawling</span>
		</div>
	)
}

type DownloadBarProps = { progress: number; total: number | null; path: string }

function DownloadBar(props: DownloadBarProps) {
	return (
		<>
			{props.total === null ? (
				<progress class="progress progress-primary"></progress>
			) : (
				<progress class="progress progress-primary" value={props.progress} max={props.total}></progress>
			)}
			<DownloadBarText {...props} />
		</>
	)
}

export function FinishedDownloadBar(props: DownloadBarProps) {
	return (
		<div class="mb-4">
			<progress class="progress progress-success" value="100" max="100"></progress>
			<DownloadBarText {...props} />
		</div>
	)
}

function DownloadBarText({ progress, total, path }: DownloadBarProps) {
	return (
		<div class="flex justify-between">
			<span class="flex-grow">{path}</span>
			<span class="ml-4 whitespace-nowrap">
				<span class="font-bold">{formatBytes(progress)}</span>
				{total !== null && (
					<>
						<span> / </span>
						<span class="font-bold">{formatBytes(total)}</span>
					</>
				)}
			</span>
		</div>
	)
}
