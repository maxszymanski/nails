'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/app/i18n/client'
import type { MetaCheckoutResult } from '@/src/lib/meta-checkout'
import { useCartStore } from '../stores/CartStore'
import useModalStore from '../stores/modalStore'
import Button from './Button'
import LinkButton from './LinkButton'

export default function MetaCheckout({ result, lng }: { result: MetaCheckoutResult; lng: string }) {
	const { t } = useT('translations')
	const router = useRouter()
	const setOpenModal = useModalStore(state => state.setOpenModal)
	const applied = useRef(false)
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		if (!result.ok || applied.current) return
		let cancelled = false
		let opened = false
		async function prepare() {
			try {
				await useCartStore.persist?.rehydrate()
				if (cancelled || applied.current || !result.ok) return
				useCartStore.getState().replaceItems(result.items)
				applied.current = true
				setOpenModal('cart')
				opened = true
			} catch {
				if (!cancelled) setFailed(true)
			}
		}
		void prepare()
		return () => {
			cancelled = true
			if (opened && useModalStore.getState().openModal === 'cart') useModalStore.getState().closeModal()
		}
	}, [result, setOpenModal])

	if (!result.ok || failed) {
		const code = failed ? 'IMPORT_FAILED' : !result.ok ? result.code : 'IMPORT_FAILED'
		return (
			<div className="flex flex-col items-start gap-6">
				<p role="alert" className="text-sm leading-6 text-alert">
					{t(code === 'WEIGHT_LIMIT' ? 'checkout.errors.WEIGHT_LIMIT' : `metaCheckout.errors.${code}`)}
				</p>
				{code === 'COUPON_UNSUPPORTED' && (
					<Button type="button" onClick={() => {
						const url = new URL(window.location.href)
						url.searchParams.delete('coupon')
						router.replace(`${url.pathname}${url.search}`, { scroll: false })
					}}>{t('metaCheckout.withoutCoupon')}</Button>
				)}
				{failed && <Button type="button" onClick={() => window.location.reload()}>{t('checkout.retry')}</Button>}
				<LinkButton href={`/${lng}/produkte`}>{t('products.products.title')}</LinkButton>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-start gap-6">
			<p className="text-grayscale-500 leading-6">{t('metaCheckout.ready')}</p>
			<Button type="button" onClick={() => setOpenModal('cart')}>
				{t('metaCheckout.continue')}
			</Button>
			<LinkButton href={`/${lng}/produkte`} variant="secondary">{t('products.products.title')}</LinkButton>
			<noscript><p className="text-sm leading-6">{t('metaCheckout.noScript')}</p></noscript>
		</div>
	)
}
