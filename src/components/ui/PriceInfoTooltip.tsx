'use client'

import { useId, useState } from 'react'
import {
	autoUpdate, flip, FloatingFocusManager, FloatingPortal, offset, safePolygon, shift,
	useClick, useDismiss, useFloating, useFocus, useHover, useInteractions, useRole,
} from '@floating-ui/react'
import { Info } from 'lucide-react'
import Link from 'next/link'
import { useT } from '@/app/i18n/client'
import Button from './Button'

export default function PriceInfoTooltip({ lng }: { lng: string }) {
	const { t } = useT('translations')
	const [isOpen, setIsOpen] = useState(false)
	const descriptionId = useId()
	const { refs: { setReference, setFloating }, floatingStyles, context } = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		placement: 'top-end',
		strategy: 'fixed',
		middleware: [offset(8), flip({ padding: 16 }), shift({ padding: 16 })],
		whileElementsMounted: autoUpdate,
	})
	const hover = useHover(context, { handleClose: safePolygon() })
	const focus = useFocus(context)
	const click = useClick(context)
	const dismiss = useDismiss(context, { ancestorScroll: true })
	const role = useRole(context, { role: 'dialog' })
	const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, click, dismiss, role])

	return (
		<>
			<Button
				type="button" variant="default" ref={setReference}
				aria-label={t('products.priceInfo')}
				restClass="size-6 shrink-0 rounded-full text-grayscale-500 hover:bg-grayscale-100 focus-visible:ring-my-purple"
				{...getReferenceProps()}>
				<Info size={16} aria-hidden="true" />
			</Button>
			{isOpen && <FloatingPortal>
				<FloatingFocusManager context={context} modal={false} initialFocus={-1}>
					<div
						ref={setFloating} style={floatingStyles}
						aria-label={t('products.priceInfo')} aria-describedby={descriptionId}
						className="z-50 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-grayscale-200 bg-white p-4 text-sm leading-5 text-grayscale-500 shadow-lg"
						{...getFloatingProps()}>
						<p id={descriptionId}>{t('products.priceNotice')}</p>
						<Link href={`/${lng}/versand-zahlung`} className="underline hover:text-black-primary/80 duration-300">
							{t('products.shippingCosts')}
						</Link>
					</div>
				</FloatingFocusManager>
			</FloatingPortal>}
		</>
	)
}
