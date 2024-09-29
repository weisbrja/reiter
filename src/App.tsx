import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import "./App.css"

export default function App() {
  const [greetMsg, setGreetMsg] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name: "Preact" }));
  }

  async function showWindow() {
    await invoke("show_window");
  }

  useEffect(() => { showWindow(); }, [])
  useEffect(() => { greet(); }, [])

  return <div class="p-1">
    <h1 class="text-2xl fond-bold mt-8 mb-4 text-center">{greetMsg}</h1>
    <div class="flex justify-between p-4">
      <button class="btn flex-1 mx-2 btn-outline">Button</button>
      <button class="btn flex-1 mx-2 btn-info">Info</button>
      <button class="btn flex-1 mx-2 btn-error">Error</button>
      <button class="btn flex-1 mx-2 btn-accent">Accent</button>
      <button class="btn flex-1 mx-2 btn-primary">Primary</button>
      <button class="btn flex-1 mx-2 btn-success">Success</button>
    </div>
  </div>;
}
