import { JSX } from "preact/jsx-runtime";

export default function Bar({ children }: { children: JSX.Element | JSX.Element[] }) {
	return <div class="flex items-center justify-between bg-base-300 p-2 h-[4rem]">
		{children}
	</div>;
}
