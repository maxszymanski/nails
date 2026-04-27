'use client'

import { useState } from 'react'

interface AccorderonProps {
	idx: number
	title: string
	answer?: string
}

function FaqAccordeon({ idx, title, answer }: AccorderonProps) {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<div
			className="w-full pb-4  border-b border-grayscale-200 overflow-hidden"
			data-aos="fade-up"
			data-aos-delay={100 * idx}>
			<button
				className={`w-full my-outline justify-between flex sm:items-center gap-4 cursor-pointer  group pb-2  ${idx === 0 ? 'pt-0' : 'pt-6 '}`}
				onClick={() => setIsOpen(is => !is)}>
				<p className="text-left leading-6 transition-colors duration-300 group-hover:text-black-primary/80">
					{title}
				</p>
				<span className="text-2xl flex items-center justify-center  text-cap  text-my-purple duration-300 transition-colors  h-6 w-6 relative ">
					<span
						className={`absolute -top-0.5 left-0 size-6 shrink-0 w-full h-full flex items-center justify-center ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 `}>
						-
					</span>
					<span
						className={`absolute top-0 left-0 size-6 shrink-0 w-full h-full flex items-center justify-center ${isOpen ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
						+
					</span>
				</span>
			</button>
			<p
				className={` text-grayscale-500 pr-4 sm:pr-6 transition-all duration-300  text-sm md:text-base select-none ${isOpen ? 'visible opacity-100 max-h-[500px] pb-6 ' : 'invisible opacity-20 max-h-0 '}  `}>
				{answer}
			</p>
		</div>
	)
}

export default FaqAccordeon
