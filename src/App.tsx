import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import "./App.css"

export default function App() {
  const [greetMsg, setGreetMsg] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name: "Preact" }));
  }

  useEffect(() => { greet() }, [])

  return <div><h1>{greetMsg}</h1></div>;
}
