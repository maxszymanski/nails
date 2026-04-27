'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import LogoLink from '../ui/LogoLink'
import DesktopNav from './DesktopNav'
import Button from '../ui/Button'
import BasketButton from '../ui/BasketButton'
import NavList from './NavList'

import LanguageSwitcher from './LanguageSwitcher'

function Navbar({ lng }: { lng: string }) {
	const [show, setShow] = useState(true)
	const navRef = useRef(null)
	const [lastScrollY, setLastScrollY] = useState(0)
	const [isExpanded, setIsExpanded] = useState(false)

	const [isSocialOpen, setIsSocialOpen] = useState(false)

	const pathname = usePathname()

	const toogleNav = () => {
		setIsExpanded(is => !is)
	}
	const closeNav = useCallback(() => {
		setIsExpanded(false)

		setIsSocialOpen(false)
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

			setLastScrollY(currentY)
		}

		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [lastScrollY, isExpanded])

	return (
		<>
			<header className="w-full">
				<nav
					className={`px-4 lg:left-1/2 lg:-translate-x-1/2 left-0 duration-400  fixed top-0 z-60 flex flex-col xl:max-w-[1172px]  xl:mx-auto  w-full transition-all ${show ? 'translate-y-0' : '-translate-y-full'} ${isExpanded ? 'overflow-y-auto max-h-dvh  h-full' : 'overflow-y-hidden max-h-22'}  lg:max-h-22 delay-200 lg:overflow-y-visible`}
					ref={navRef}>
					{/* mobile */}
					<div className="relative  py-6 w-full flex justify-between items-center z-20 lg:hidden ">
						<LogoLink />
						<div className="flex items-center gap-4">
							{' '}
							<BasketButton />
							<div className="h-6 w-px bg-grayscale"></div>
							<Button
								type="button"
								aria-label="toogle navigation menu"
								variant="rounded"
								role="button"
								onClick={toogleNav}>
								<svg
									className={`absolute top-1/2 left-1/2 transition-opacity duration-300   -translate-x-1/2 -translate-y-1/2 ${isExpanded ? 'opacity-0' : 'opacity-100 '}`}
									width="18"
									height="14"
									viewBox="0 0 18 14"
									fill="none"
									xmlns="http://www.w3.org/2000/svg">
									<path
										d="M16.75 12.75H0.75M16.75 6.75H0.75M16.75 0.75H0.75"
										stroke="#565656"
										strokeWidth="1.5"
										strokeLinecap="round"
									/>
								</svg>
								<svg
									width="14"
									height="14"
									viewBox="0 0 14 14"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									className={`absolute top-1/2 left-1/2 transition-opacity duration-300   -translate-x-1/2 -translate-y-1/2 ${isExpanded ? 'opacity-100 delay-100' : 'opacity-0'}`}>
									<path
										d="M0.75 0.75L12.75 12.75"
										stroke="#565656"
										strokeWidth="1.5"
										strokeLinecap="round"
									/>
									<path
										d="M12.75 0.75L0.75 12.75"
										stroke="#565656"
										strokeWidth="1.5"
										strokeLinecap="round"
									/>
								</svg>
							</Button>
						</div>
					</div>
					<div
						className={`lg:hidden flex flex-col h-dvh justify-between relative pb-4 w-full ${!isExpanded ? '-z-10 opacity-0 pointer-events-none delay-1000' : ' z-60 opacity-100 '}`}>
						<NavList
							lng={lng}
							isExpanded={isExpanded}
							isSocialOpen={isSocialOpen}
							toggleIsSocialOpen={() => setIsSocialOpen(is => !is)}
						/>

						<div
							className={`w-full  sticky bottom-0 transition-all duration-500 ${
								!isExpanded
									? 'opacity-0 text-grayscale -translate-y-4 delay-100'
									: 'opacity-100 text-grayscale translate-y-0 delay-900'
							}`}>
							<LanguageSwitcher lng={lng} />
						</div>
					</div>

					{/* desktop */}
					<DesktopNav lng={lng} />
				</nav>
			</header>
			<div
				className={`fixed top-8 right-8 z-55 w-1 h-1 rounded-full bg-white
    transition-transform will-change-transform pointer-events-none  origin-center duration-1000 lg:hidden
    ${isExpanded ? 'scale-[800] ease-[cubic-bezier(0.55,0.055,0.675,0.19)]' : 'scale-0 '}`}
				style={{ transformOrigin: 'center' }}></div>
			<div
				className={`  w-full fixed top-0 left-0 z-20 h-22 bg-white duration-400 delay-200 transition-transform ${show ? 'translate-y-0' : '-translate-y-full'}`}></div>
		</>
	)
}

export default Navbar
