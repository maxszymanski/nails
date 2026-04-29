function Spinner({ restClass = '' }: { restClass?: string }) {
	return (
		<span
			className={`border-s-indigo-700 h-5 w-5 animate-spin rounded-full border-4 border-t-white ${restClass}`}></span>
	)
}

export default Spinner
