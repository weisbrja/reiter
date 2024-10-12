import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { ProgressBars, useProgressBarChannelContext } from "./ProgressBars";
import { Popup } from "./Popup";
import { UsernameForm } from "./forms/UsernameForm";
import { PasswordForm } from "./forms/PasswordForm";

type RequestSubject = "password" | "username" | "jsonArgs";

type OpenLoginForm = "username" | "password" | null;

export default function SattelManager({ onCancel }: { onCancel: () => void }) {
	const [crawler, setCrawler] = useState<string | undefined>();
	const [openLoginForm, setOpenLoginForm] = useState<OpenLoginForm>(null);
	const [loginFailed, setLoginFailed] = useState(false);

	const progressBarEvent = useProgressBarChannelContext();

	async function runSattel() {
		await invoke("ensure_default_config");
		invoke("run_sattel", { progressBarEvent }).catch(error => console.error(error));
	}

	function cancelSattel() {
		emit("cancel");
		onCancel();
	}

	useEffect(() => {
		runSattel();
		return cancelSattel;
	}, []);

	useEffect(() => {
		const loginFailedUnlisten = listen("loginFailed", _ => {
			setLoginFailed(true);
		});

		const requestUnlisten = listen<RequestSubject>("request", event => {
			if (event.payload === "jsonArgs") {
				emit("response", "{}");
			} else {
				setOpenLoginForm(event.payload);
			}
		});

		const crawlUnlisten = listen<string>("crawl", event => {
			setCrawler(event.payload);
		});

		return () => {
			loginFailedUnlisten.then(unlisten => unlisten());
			requestUnlisten.then(unlisten => unlisten());
			crawlUnlisten.then(unlisten => unlisten());
		};
	}, []);

	return <>
		<div class="flex items-center justify-between mb-4">
			<button class="btn btn-error mr-4" onClick={cancelSattel}>Cancel</button>
			{crawler
				? <span class="font-bold">Crawling {crawler}</span>
				: <span class="loading loading-dots"></span>
			}
		</div>
		<ProgressBars />
		{openLoginForm &&
			<Popup
				title="Login"
				prevError={loginFailed ? "Login failed. Please reenter credentials." : null}
				onCancel={() => {
					setOpenLoginForm(null);
					cancelSattel();
				}}
			>
				{openLoginForm === "username"
					? <UsernameForm onSubmit={username => {
						emit("response", username);
						setOpenLoginForm(null);
						setLoginFailed(false);
					}} />
					: <PasswordForm onSubmit={password => {
						emit("response", password);
						setOpenLoginForm(null);
						setLoginFailed(false);
					}} />
				}
			</Popup >
		}
	</>;
}
