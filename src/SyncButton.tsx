import { useContext, useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { ProgressBars, ProgressBarChannelContextProvider, useProgressBarChannelContext } from "./ProgressBars";
import { createContext, ReactNode } from "preact/compat";

type RequestSubject = "password" | "username" | "jsonArgs";

export default function SyncButton() {
	const [resetKey, setResetKey] = useState(0);

	const [isSattelRunning, setSattelRunning] = useState(false);

	function runSattel() {
		setSattelRunning(true);
	}

	function stopSattel() {
		setSattelRunning(false);
		emit("cancel");
		setResetKey(prevKey => prevKey + 1);
	}

	return (
		<div class="p-4">
			{!isSattelRunning
				? <button class="btn btn-primary" onClick={runSattel}>Sync All</button>
				: <ProgressBarChannelContextProvider key={resetKey}>
					<SattelRunner onCancel={stopSattel} />
				</ProgressBarChannelContextProvider>
			}
		</div >
	);
}

function SattelRunner({ onCancel }: { onCancel: () => void }) {
	const progressBarEvent = useProgressBarChannelContext();
	const [crawler, setCrawler] = useState<string | undefined>(undefined);
	const [openLoginForm, setOpenLoginForm] = useState<ReactNode>(null);
	const [loginFailed, setLoginFailed] = useState(false);

	useEffect(() => {
		const loginFailedUnlisten = listen("loginFailed", _ => {
			console.error("login failed")
			setLoginFailed(true);
		});

		const requestUnlisten = listen<RequestSubject>("request", event => {
			switch (event.payload) {
				case "jsonArgs":
					// run all crawlers
					emit("response", "{}");
					break;
				case "password":
					setOpenLoginForm(<PasswordForm onSubmit={password => {
						emit("response", password);
						setOpenLoginForm(null);
						setLoginFailed(false);
					}} />);
					break;
				case "username":
					setOpenLoginForm(<UsernameForm onSubmit={username => {
						emit("response", username);
						setOpenLoginForm(null);
					}} />);
					break;
			}
		});

		const crawlUnlisten = listen<string>("crawl", event => {
			setCrawler(event.payload);
		});

		invoke("run_sattel", { progressBarEvent });

		return () => {
			loginFailedUnlisten.then(unlisten => unlisten());
			requestUnlisten.then(unlisten => unlisten());
			crawlUnlisten.then(unlisten => unlisten());
			onCancel();
		};
	}, []);

	return <>
		<button class="btn btn-error mb-4" onClick={onCancel}>Cancel</button>
		<div class="min-h-[3rem]">
			{crawler
				? <h1 class="text-2xl font-bold">Crawling {crawler}</h1>
				: <span class="loading loading-dots loading-lg"></span>
			}
		</div>
		<ProgressBars />
		{openLoginForm && <LoginPopup loginFailed={loginFailed} onCancel={() => {
			setOpenLoginForm(null);
			onCancel();
		}}>
			{openLoginForm}
		</LoginPopup>
		}
	</>;
}

type LoginErrorContextType = {
	setError: (error: string | null) => void,
	onCancel: () => void,
};

export const LoginErrorContext = createContext<LoginErrorContextType | undefined>(undefined);

export function useLoginErrorContext() {
	const context = useContext(LoginErrorContext);
	if (context === undefined) {
		throw new Error("useLoginErrorContext must be used with a LoginErrorContext.Provider");
	}
	return context;
}

function LoginPopup({ loginFailed, onCancel, children }: { loginFailed: boolean, onCancel: () => void, children: ReactNode }) {
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (loginFailed) {
			setError("Login failed. Reenter credentials.");
		}
	}, [loginFailed]);

	return (
		<div class="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
			{children &&
				<div class="bg-base-300 rounded-lg p-6 w-1/3 min-w-96">
					<h2 class="text-lg font-bold mb-4">Login</h2>
					{error && <p class="text-error mb-2">{error}</p>}
					<LoginErrorContext.Provider value={{ setError, onCancel }}>
						{children}
					</LoginErrorContext.Provider >
				</div>
			}
		</div>
	);
}

function UsernameForm({ onSubmit }: { onSubmit: (username: string) => void }) {
	const { setError, onCancel } = useLoginErrorContext();
	const [username, setUsername] = useState("");

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (!username) {
			setError("Username required.");
			return;
		}

		onSubmit(username);
	}

	return (
		<form onSubmit={handleSubmit}>
			<div class="form-control mb-4">
				<div class="label">
					<label class="label-text">Username</label>
				</div>
				<input
					type="text"
					id="username"
					value={username}
					onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
					class="input input-bordered"
					placeholder="Enter your username"
				/>
			</div>
			<div class="flex justify-end">
				<button type="button" onClick={onCancel} class="btn btn-error mr-4">Cancel</button>
				<button type="submit" class="btn btn-primary">Continue</button>
			</div>
		</form>
	);
}

function PasswordForm({ onSubmit }: { onSubmit: (password: string) => void }) {
	const { setError, onCancel } = useLoginErrorContext();
	const [password, setPassword] = useState("");

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (!password) {
			setError("Password required.");
			return;
		}

		onSubmit(password);
	}

	return (
		<form onSubmit={handleSubmit}>
			<div class="form-control mb-4">
				<div class="label">
					<label class="label-text">Password</label>
				</div>
				<input
					type="password"
					id="password"
					value={password}
					onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
					class="input input-bordered"
					placeholder="Enter your password"
				/>
			</div>
			<div class="flex justify-end">
				<button type="button" onClick={onCancel} class="btn btn-error mr-4">Cancel</button>
				<button type="submit" class="btn btn-primary">Login</button>
			</div>
		</form>
	);
};
