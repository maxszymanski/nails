'use client'

import { useEffect } from 'react'
import useModalStore from '../stores/modalStore'

function Modal({
	children,
	stopReset = false,

	mutation,
}: {
	children: React.ReactNode
	stopReset?: boolean

	mutation?: () => void
}) {
	const closeModal = useModalStore(state => state.closeModal)

	useEffect(() => {
		document.body.classList.add('body--modal-open')
		document.documentElement.classList.add('body--modal-open')
		return () => {
			document.body.classList.remove('body--modal-open')
			document.documentElement.classList.remove('body--modal-open')
		}
	}, [])

	const handleClickOutside = () => {
		if (mutation) {
			mutation()
			return
		}
		if (stopReset) return
		closeModal()
	}

	return (
		<div
			className={` bg-black-primary/50  fixed left-0 top-0  h-dvh lg:h-screen w-full  overflow-hidden    animate-visible z-100  flex justify-end `}
			onClick={handleClickOutside}>
			<div
				className={`z-110 max-h-dvh w-fit lg:max-h-screen my-scrollbar h-full overflow-y-auto overflow-x-hidden }`}
				onClick={e => e.stopPropagation()}>
				{children}
			</div>
		</div>
	)
}

export default Modal
