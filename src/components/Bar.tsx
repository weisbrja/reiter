import { JSX } from "preact/jsx-runtime"

export default function Bar({ children }: { children: JSX.Element | JSX.Element[] }) {
	return <div class="relative flex items-center bg-base-300 p-2 h-[4rem]">{children}</div>
}
