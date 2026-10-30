'use client'

import { useEffect, useRef } from 'react'
import useModalStore from '../stores/modalStore'

function Modal({
	children,
	stopReset = false,
	labelledBy,

	mutation,
}: {
	children: React.ReactNode
	stopReset?: boolean
	labelledBy: string

	mutation?: () => void
}) {
	const closeModal = useModalStore(state => state.closeModal)
	const dialogRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
		const dialog = dialogRef.current
		const siblings = Array.from(dialog?.parentElement?.children ?? [])
			.filter((element): element is HTMLElement => element instanceof HTMLElement && element !== dialog)
			.map(element => ({ element, inert: element.inert }))
		for (const { element } of siblings) element.inert = true
		const keepFocusInside = (event: FocusEvent) => {
			if (dialog && event.target instanceof Node && !dialog.contains(event.target)) dialog.focus()
		}
		document.addEventListener('focusin', keepFocusInside)
		dialog?.focus()
		document.body.classList.add('body--modal-open')
		document.documentElement.classList.add('body--modal-open')
		return () => {
			document.removeEventListener('focusin', keepFocusInside)
			for (const { element, inert } of siblings) element.inert = inert
			document.body.classList.remove('body--modal-open')
			document.documentElement.classList.remove('body--modal-open')
			if (previousFocus?.isConnected) previousFocus.focus()
		}
	}, [])

	const handleClickOutside = () => {
		if (stopReset) return
		if (mutation) {
			mutation()
			return
		}
		closeModal()
	}

	return (
		<div
			ref={dialogRef}
			role="dialog"
			tabIndex={-1}
			aria-labelledby={labelledBy}
			aria-modal="true"
			aria-busy={stopReset}
			onKeyDown={event => {
				if (event.key === 'Escape') {
					event.preventDefault()
					event.stopPropagation()
					handleClickOutside()
				}
				if (event.key === 'Tab') {
					const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'))
						.filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0 && !element.closest('[hidden], [inert]'))
					const first = controls[0]
					const last = controls[controls.length - 1]
					if (!first) { event.preventDefault(); return }
					if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) {
						event.preventDefault()
						last.focus()
					} else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement as HTMLElement))) {
						event.preventDefault()
						first.focus()
					}
				}
			}}
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
