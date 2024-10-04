import { useEffect } from 'preact/hooks';
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';

export default function TauriEventLogger() {
	useEffect(() => {
		invoke('run_sattel', { jsonArgs: "{}" })
			.then(() => console.log('sattel executed'))
			.catch(error => console.error('sattel error', error))

		const unlisten = listen('sattel', event => console.log('event received:', event));

		return () => {
			unlisten.then(unlisten => unlisten());
		};
	}, []);

	return <div>Listening to Tauri events...</div>;
}
