'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import LogoLink from '../ui/LogoLink'
import DesktopNav from './DesktopNav'

function Navbar({ lng }: { lng: string }) {
	const [show, setShow] = useState(true)
	const navRef = useRef(null)
	const [lastScrollY, setLastScrollY] = useState(0)
	const [isExpanded, setIsExpanded] = useState(false)
	const [hasBorder, setHasBorder] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [isDevOpen, setIsDevOpen] = useState(false)

	const pathname = usePathname()

	const toogleNav = () => {
		setIsExpanded(is => !is)
	}
	const closeNav = useCallback(() => {
		setIsExpanded(false)
		setIsOpen(false)
		setIsDevOpen(false)
	}, [])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		closeNav()
	}, [pathname, closeNav])

	useEffect(() => {
		if (isExpanded) {
			document.body.classList.add('overflow-hidden')
		} else {
			document.body.classList.remove('overflow-hidden')
		}
	}, [isExpanded])

	useEffect(() => {
		const handleScroll = () => {
			const currentY = window.scrollY
			const triggerScroll = 88

			if (currentY > triggerScroll) {
				if (currentY > lastScrollY) {
					setShow(false)
					setIsExpanded(false)
				} else {
					setShow(true)
				}
			} else {
				setShow(true)
			}

			setHasBorder(currentY > 0)

			setLastScrollY(currentY)
		}

		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [lastScrollY, isExpanded])

	return (
		<header className="w-full">
			<nav
				className={`fixed lg:left-1/2 lg:-translate-x-1/2 top-0 z-60 left-0 w-full bg-white  px-4 transition-all duration-400 lg:px-0 ${show ? 'translate-y-0' : '-translate-y-full'}`}>
				{/* mobile */}
				<div className="relative  py-6 w-full flex justify-between items-center z-20 lg:hidden ">
					<LogoLink />

					<button
						className={`rounded-full size-10 shrink-0 border border-grayscale flex items-center justify-center`}
						type="button"
						aria-label="toogle navigation menu"
						role="button"
						onClick={toogleNav}>
						<svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M16.75 12.75H0.75M16.75 6.75H0.75M16.75 0.75H0.75"
								stroke="#565656"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>

				{/* desktop */}
				<DesktopNav lng={lng} />
			</nav>
		</header>
	)
}

export default Navbar
