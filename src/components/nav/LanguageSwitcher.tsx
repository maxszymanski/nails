'use client'

import { useRouter, usePathname } from 'next/navigation'
import { languages } from '@/app/i18n/settings'
import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'
import Image from 'next/image'

const languagesOptions = [
	{
		value: 'en',
		label: 'English',
		flag: '/assets/english.png',
	},
	{
		value: 'de',
		label: 'Deutsch',
		flag: '/assets/english.png',
	},
]

export default function LanguageSwitcher({ lng }: { lng: string }) {
	const router = useRouter()
	const pathname = usePathname()
	const [open, setOpen] = useState(false)

	const ref = useRef<HTMLDivElement>(null)

	const current = languagesOptions.find(l => l.value === lng) ?? languagesOptions[0]

	const handleSelect = (value: string) => {
		const newPath = pathname.replace(`/${lng}`, `/${value}`)
		router.push(newPath)
		setOpen(false)
	}

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [])

	return (
		<div className="relative" ref={ref}>
			<Button
				variant="switch"
				onClick={() => setOpen(is => !is)}
				restClass={`w-full gap-2 relative lg:w-[128px]`}>
				<Image
					src={current.flag}
					alt={current.label}
					width={20}
					height={14}
					className="object-cover"
					quality={100}
				/>
				<span className="text-sm font-medium leading-5 text-grayscale-500 flex-1 text-left">
					{current.label}
				</span>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={`transition-transform duration-300 ${!open ? 'rotate-180 lg:rotate-0' : 'rotate-0 lg:rotate-180'}`}>
					<path
						d="M17 9.5L12 14.5L7 9.5"
						stroke="#060606"
						strokeWidth="1.25"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</Button>
			{open && (
				<div className="absolute bottom-[calc(100%+4px)] lg:bottom-auto lg:top-[calc(100%+4px)] left-0 right-0 bg-white border border-grayscale-100 rounded-2xl overflow-hidden z-10 lg:rounded-sm">
					{languagesOptions.map((option, i) => (
						<div key={option.value}>
							{i > 0 && <div className="h-px grayscale-100" />}
							<button
								onClick={() => handleSelect(option.value)}
								className={`w-full h-10 px-2.5 flex items-center gap-2 cursor-pointer duration-300 transition-colors ${lng === option.value ? 'bg-grayscale-100' : 'hover:bg-grayscale-100/50'}`}>
								<Image
									src={option.flag}
									alt={option.label}
									width={20}
									height={14}
									className="object-cover rounded-sm"
								/>
								<span className="text-sm font-medium text-black">{option.label}</span>
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
