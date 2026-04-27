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
			className="w-full pb-2  border-b border-grayscale-200 overflow-hidden"
			data-aos="fade-up"
			data-aos-delay={100 * idx}>
			<button
				className={`w-full my-outline  flex sm:items-center gap-4 cursor-pointer  group pb-6  ${idx === 0 ? 'pt-0' : 'pt-8 sm:pt-10'}`}
				onClick={() => setIsOpen(is => !is)}>
				<p className=" leading-6 transition-colors duration-300 group-hover:text-black-primary/80">{title}</p>
				<span className="text-2xl inline-block  text-cap  group-hover:text-ocean duration-300 transition-colors ml-auto h-4 w-[13px]  relative -translate-x-1">
					<span className={`absolute -top-2.5 left-0 -translate-y-0.5 `}>-</span>
					<span
						className={`absolute -top-2.5 left-0  ${isOpen ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
						+
					</span>
				</span>
			</button>
			<p
				className={`text-cap text-grayscale pr-4 sm:pr-8 transition-all duration-300  text-sm md:text-base sm:pl-[79px] md:pl-[142px] lg:pl-[95px] xl:pl-[142px] select-none ${isOpen ? 'visible opacity-100 max-h-[500px] pb-6 ' : 'invisible opacity-20 max-h-0 '}  `}>
				{answer ||
					'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Non amet soluta laboriosam cum inventore nisi quos quidem aperiam quisquam facere!'}
			</p>
		</div>
	)
}

export default FaqAccordeon
