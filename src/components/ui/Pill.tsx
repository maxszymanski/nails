function Pill({ text }: { text: string }) {
	return (
		<p className="rounded-full bg-my-purple/10 px-3 h-6 flex items-center justify-center text-my-purple text-sm leading-5 w-fit">
			{text}
		</p>
	)
}

export default Pill
