import { useEffect, useRef, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import "./App.css"

export default function App() {
  const [loading, setLoading] = useState(true);

  async function showWindow() {
    await invoke("show_window");
  }

  useEffect(() => { showWindow(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return loading ? <Loading /> : <Main />;
}

export function Main() {
  return <>
    <div class="flex items-center justify-center h-screen">
      <div class="p-4 flex flex-col space-y-4">
        <Heading />
        <Buttons />
      </div>
    </div>
    <div class="absolute top-4 right-4"><Theme /></div>
  </>;
}

export function Loading() {
  return <div class="flex items-center justify-center h-screen">
    <span class="loading loading-spinner loading-lg"></span>
  </div>;
}

export function Heading() {
  const [greetMsg, setGreetMsg] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name: "Preact" }));
  }

  useEffect(() => { greet(); }, [])

  return <h1 class="text-2xl fond-bold text-center">{greetMsg}</h1>;
}

export function Buttons() {
  const [maxWidth, setMaxWidth] = useState(0);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buttonContainerRef.current) {
      const buttons = buttonContainerRef.current?.querySelectorAll('.btn') as NodeListOf<HTMLButtonElement>;
      let largestWidth = 0;
      buttons.forEach(button => {
        const buttonWidth = button.offsetWidth;
        if (buttonWidth > largestWidth) {
          largestWidth = buttonWidth;
        }
      })

      setMaxWidth(largestWidth);
    }
  }, [buttonContainerRef])

  return <div ref={buttonContainerRef} class="flex flex-wrap justify-center">
    <button style={{ width: maxWidth || "auto" }} class="btn btn-outline m-2">Button</button>
    <button style={{ width: maxWidth || "auto" }} class="btn btn-info m-2">Info</button>
    <button style={{ width: maxWidth || "auto" }} class="btn btn-error m-2">Error</button>
    <button style={{ width: maxWidth || "auto" }} class="btn btn-accent m-2">Accent</button>
    <button style={{ width: maxWidth || "auto" }} class="btn btn-primary m-2">Primary</button>
    <button style={{ width: maxWidth || "auto" }} class="btn btn-success m-2">Success</button>
  </div>;
}

export function Theme() {
  return <label className="swap swap-rotate">
    {/* this hidden checkbox controls the state */}
    <input type="checkbox" className="theme-controller" value="light" />

    {/* sun icon */}
    <svg
      className="swap-off h-10 w-10 fill-current"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24">
      <path
        d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
    </svg>

    {/* moon icon */}
    <svg
      className="swap-on h-10 w-10 fill-current"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24">
      <path
        d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
    </svg>
  </label>;
}
