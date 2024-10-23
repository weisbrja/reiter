import { useContext, useEffect, useRef, useState } from "preact/hooks"
import { Channel, invoke } from "@tauri-apps/api/core"
import { listen, emit } from "@tauri-apps/api/event"
import { ProgressBar, ProgressBarMsg } from "./ProgressBars"
import UsernameDialog from "../dialogs/UsernameDialog"
import PasswordDialog from "../dialogs/PasswordDialog"
import { createContext, JSX } from "preact"

type RequestSubject = "password" | "username"

type SattelContextType = {
	isSattelRunning: boolean
	currentCrawler: string | undefined
	finishedProgressBars: Map<number, ProgressBar>
	runningProgressBars: Map<number, ProgressBar>
	queueSattel: (crawler: string | null) => void
	cancelSattel: () => void
}

export const SattelContext = createContext<SattelContextType | undefined>(undefined)

export function useSattelContext() {
	const context = useContext(SattelContext)
	if (context === undefined) {
		throw new Error("useSattelContext must be used with a SattelContextProvider")
	}
	return context
}

export function SattelProvider({ children }: { children: JSX.Element | JSX.Element[] }) {
	const [isSattelRunning, setSattelRunning] = useState(false)
	const [queuedCrawlers, setQueuedCrawlers] = useState<string[] | null | undefined>()

	const [currentCrawler, setCurrentCrawler] = useState<string | undefined>()

	const [progressBarMsgs, setProgressBarMsgs] = useState<Channel<ProgressBarMsg>>(new Channel())
	const [finishedProgressBars, setFinishedProgressBars] = useState<Map<number, ProgressBar>>(new Map())
	const [runningProgressBars, setRunningProgressBars] = useState<Map<number, ProgressBar>>(new Map())

	function queueSattel(crawler: string | null) {
		if (queuedCrawlers === null) {
			// already syncing all crawlers
			return
		}
		if (crawler) {
			setQueuedCrawlers(queuedCrawlers ? [...queuedCrawlers, crawler] : [crawler])
		} else {
			// sync all crawlers
			setQueuedCrawlers(null)
		}
	}

	function cancelSattel() {
		setQueuedCrawlers(undefined)
		emit("cancel")
	}

	async function runSattel(jsonArgs: string) {
		setSattelRunning(true)
		try {
			await invoke("run_sattel", { jsonArgs, progressBarMsgs })
		} catch (error) {
			console.error(error)
		}
		setProgressBarMsgs(new Channel())
		setFinishedProgressBars(new Map())
		setRunningProgressBars(new Map())
		setSattelRunning(false)
	}

	// run sattel if sattel is not already running but there are crawlers queued
	useEffect(() => {
		if (!isSattelRunning && queuedCrawlers !== undefined) {
			const jsonArgs = queuedCrawlers ? JSON.stringify({ crawlers: queuedCrawlers }) : "{}"
			setQueuedCrawlers(undefined)
			runSattel(jsonArgs)
		}
	}, [isSattelRunning, queuedCrawlers])

	// listen to crawl messages
	useEffect(() => {
		const crawlUnlisten = listen<string>("crawl", (event) => {
			setCurrentCrawler(event.payload)
		})

		return () => crawlUnlisten.then((unlisten) => unlisten())
	}, [])

	// listen to progress bar messages
	useEffect(() => {
		progressBarMsgs.onmessage = (message) => {
			const id = message.id
			const event = message.event
			switch (event.kind) {
				case "begin":
					setRunningProgressBars((prevRunning) => {
						const nowRunning = new Map(prevRunning)
						nowRunning.set(id, { bar: event.bar, path: event.path, progress: 0, total: null })
						return nowRunning
					})
					break
				case "advance":
					setRunningProgressBars((prevRunning) => {
						const nowRunning = new Map(prevRunning)
						nowRunning.set(id, {
							...prevRunning.get(id)!,
							progress: event.progress,
						})
						return nowRunning
					})
					break
				case "setTotal":
					setRunningProgressBars((prevRunning) => {
						const nowRunning = new Map(prevRunning)
						nowRunning.set(id, {
							...prevRunning.get(id)!,
							total: event.total,
						})
						return nowRunning
					})
					break
				case "done":
					setRunningProgressBars((prevRunning) => {
						if (prevRunning.get(id)!.bar === "download") {
							setFinishedProgressBars((prevFinished) => {
								const nowFinished = new Map(prevFinished)
								nowFinished.set(id, prevRunning.get(id)!)
								return nowFinished
							})
						}

						const nowRunning = new Map(prevRunning)
						nowRunning.delete(id)
						return nowRunning
					})
					break
			}
		}
	}, [progressBarMsgs])

	return (
		<SattelContext.Provider
			value={{ isSattelRunning, queueSattel, cancelSattel, finishedProgressBars, runningProgressBars, currentCrawler }}
		>
			{children}
		</SattelContext.Provider>
	)
}

export default function SattelLoginHandler() {
	const [loginFailed, setLoginFailed] = useState(false)

	const { cancelSattel } = useSattelContext()

	const openUsernameDialogRef = useRef<() => void | undefined>()
	const openPasswordDialogRef = useRef<() => void | undefined>()

	useEffect(() => {
		const loginFailedUnlisten = listen("loginFailed", (_) => {
			setLoginFailed(true)
		})

		const requestUnlisten = listen<RequestSubject>("request", (event) => {
			switch (event.payload) {
				case "username":
					openUsernameDialogRef.current?.()
					break
				case "password":
					openPasswordDialogRef.current?.()
					break
			}
		})

		return () => {
			loginFailedUnlisten.then((unlisten) => unlisten())
			requestUnlisten.then((unlisten) => unlisten())
		}
	}, [])

	return (
		<>
			<UsernameDialog
				loginFailed={loginFailed}
				onConfirm={(username) => {
					emit("response", username)
					setLoginFailed(false)
				}}
				onCancel={() => {
					cancelSattel()
					setLoginFailed(false)
				}}
				setOpenDialogRef={(openDialog) => (openUsernameDialogRef.current = openDialog)}
			/>
			<PasswordDialog
				onConfirm={(password) => {
					emit("response", password)
					setLoginFailed(false)
				}}
				onCancel={() => {
					cancelSattel()
					setLoginFailed(false)
				}}
				setOpenDialogRef={(openDialog) => (openPasswordDialogRef.current = openDialog)}
			/>
		</>
	)
}
