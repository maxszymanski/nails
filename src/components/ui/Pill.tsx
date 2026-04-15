function Pill({ text, restClass = '' }: { text: string; restClass?: string }) {
	return (
		<p
			className={`rounded-full bg-my-purple/10 px-3 h-6 flex items-center justify-center text-my-purple text-sm leading-5 w-fit ${restClass}`}>
			{text}
		</p>
	)
}

export default Pill
