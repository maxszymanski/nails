'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import z from 'zod'
import Input from './Input'
import { useT } from '@/app/i18n/client'
import Checkbox from './Checkbox'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '../stores/CartStore'
import { CartInformation } from './CartModal'
import { toast } from 'react-toastify'
import { useEffect, useRef, useState } from 'react'
import { getOrderAttempt } from '@/src/lib/order-attempt'
import { VAT_RATES, type Quote } from '@/src/lib/checkout'
import Button from './Button'
import Spinner from './Spinner'
import { company } from '@/src/data/company'

function OrderForm({
	cartInformation,
	setIsSubmitting,
	setStep,
	isSubmitting,
}: {
	cartInformation: CartInformation
	setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>
	setStep: React.Dispatch<React.SetStateAction<number>>
	isSubmitting: boolean
}) {
	const { t } = useT('translations')
	const pathname = usePathname()

	const lng = pathname.split('/')[1] || 'en'
	const clearCart = useCartStore(state => state.clearCart)
	const submitting = useRef(false)
	const [quoteResult, setQuoteResult] = useState<{ key: string; quote?: Quote; code?: string } | null>(null)
	const [quoteRevision, setQuoteRevision] = useState(0)
	const countryNames = new Intl.DisplayNames([lng], { type: 'region' })
	const money = (cents: number) => new Intl.NumberFormat(lng, { style: 'currency', currency: 'EUR' }).format(cents / 100)

	const contactSchema = z.object({
		country: z.string().min(2),
		isBusiness: z.boolean(),
		companyName: z.string().trim().max(200),
		vatId: z.string().trim().max(30),
		firstName: z.string().nonempty(t('validation.firstNameRequired')).min(3, t('validation.firstNameMin')),
		lastName: z.string().nonempty(t('validation.lastNameRequired')).min(3, t('validation.lastNameMin')),
		address: z.string().trim().nonempty(t('validation.address')),
		zipCode: z
			.string()
			.trim()
			.nonempty(t('validation.zipCode'))
			.max(12, t('validation.zipCodeInvalid'))
			.regex(/^[A-Za-z0-9 -]{2,12}$/, t('validation.zipCodeInvalid')),
		city: z.string().trim().nonempty(t('validation.city')).min(2, t('validation.cityMin')),
		email: z.email(t('validation.emailInvalid')),
		instagram: z.string().optional(),
		message: z.string().optional(),
		terms: z.boolean().refine(val => val === true, {
			message: t('validation.termsRequired'),
		}),
	}).refine(data => !data.isBusiness || data.companyName.length > 0, {
		path: ['companyName'], message: t('checkout.companyRequired'),
	})

	type ContactType = z.infer<typeof contactSchema>

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		control,
	} = useForm<ContactType>({
		resolver: zodResolver(contactSchema),
		defaultValues: { country: 'DE', isBusiness: false, companyName: '', vatId: '' },
	})
	const [country, isBusiness, vatId] = useWatch({ control, name: ['country', 'isBusiness', 'vatId'] })
	const quotePayload = JSON.stringify({
		cart: cartInformation,
		delivery: { country, isBusiness, vatId: isBusiness ? vatId : '' },
	})
	const quoteKey = `${quoteRevision}:${quotePayload}`
	const currentResult = quoteResult?.key === quoteKey ? quoteResult : null
	const quote = currentResult?.quote
	const productsGrossCents = quote ? quote.subtotalCents + quote.productVatCents : 0
	const toFreeShipping = Math.max(0, 5000 - productsGrossCents)
	const freeShippingProgress = Math.min(100, productsGrossCents / 5000 * 100)
	const errorCode = currentResult?.code
	const manualQuote = country === 'OTHER' || errorCode === 'MANUAL_QUOTE'
	const errorMessage = (code?: string) => t(`checkout.errors.${['VAT_INVALID', 'VAT_UNAVAILABLE', 'MANUAL_QUOTE', 'QUOTE_CHANGED'].includes(code || '') ? code : 'QUOTE_UNAVAILABLE'}`)

	useEffect(() => {
		const controller = new AbortController()
		const timeout = setTimeout(async () => {
			try {
				const response = await fetch('/api/order/quote', {
					method: 'POST', headers: { 'Content-Type': 'application/json' },
					body: quotePayload, signal: controller.signal,
				})
				const result = await response.json()
				if (!controller.signal.aborted) {
					setQuoteResult({ key: quoteKey, ...(response.ok ? { quote: result.quote } : { code: result.code || 'QUOTE_UNAVAILABLE' }) })
				}
			} catch {
				if (!controller.signal.aborted) setQuoteResult({ key: quoteKey, code: 'QUOTE_UNAVAILABLE' })
			}
		}, 400)
		return () => { clearTimeout(timeout); controller.abort() }
	}, [quotePayload, quoteKey])

	const onSubmit: SubmitHandler<ContactType> = async data => {
		if (submitting.current || isSubmitting) return
		if (!quote || manualQuote) return
		if (cartInformation.items.length === 0) {
			toast.error(t('cart.empty'))
			return
		}
		submitting.current = true
		setIsSubmitting(true)

		try {
			const payload = {
				customer: { ...data, vatId: data.isBusiness ? data.vatId : '', companyName: data.isBusiness ? data.companyName : '' },
				cart: { items: [...cartInformation.items].sort((a, b) => a.id - b.id) },
				lng,
				expectedTotalCents: quote.totalCents,
				expectedVatRate: quote.vatRate,
			}
			const attempt = await getOrderAttempt(JSON.stringify(payload))
			const response = await fetch('/api/order', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...payload,
					orderId: attempt.orderId,
					createdAt: attempt.createdAt,
				}),
			})

			if (!response.ok) {
				const result = await response.json()
				if (result.code === 'ORDER_EXPIRED') {
					toast.error(t('cart.orderExpired'))
					return
				}
				if (result.code) {
					toast.error(errorMessage(result.code))
					setQuoteResult({ key: quoteKey, code: result.code })
					return
				}
				throw new Error('Order request failed')
			}

			try {
				sessionStorage.removeItem(attempt.storageKey)
			} catch {
				// Storage cleanup must not turn an accepted order into a retry.
			}
			reset()
			clearCart()
			setStep(3)
		} catch {
			toast.error(t('cart.orderError'))
		} finally {
			submitting.current = false
			setIsSubmitting(false)
		}
	}

	return (
		<form
			className="flex-1 min-h-0  py-4 lg:py-6 flex flex-col gap-6 my-scrollbar"
			onSubmit={handleSubmit(onSubmit)}
			id="order-form">
			<div className="flex flex-col gap-2">
				<label htmlFor="country">{t('checkout.country')}</label>
				<select id="country" autoComplete="country" {...register('country')} disabled={isSubmitting}
					className="w-full min-w-0 border border-grayscale-200 rounded-lg px-3 py-3 bg-white">
					{Object.keys(VAT_RATES).sort((a, b) => (countryNames.of(a) || a).localeCompare(countryNames.of(b) || b, lng)).map(code => (
						<option key={code} value={code}>{countryNames.of(code)}</option>
					))}
					<option value="OTHER">{t('checkout.outsideEu')}</option>
				</select>
			</div>
			<p className="text-sm leading-6 text-grayscale-500">
				{t('checkout.manualQuote')}{' '}
				<a className="block underline break-all" href={`mailto:${company.email}`}>{company.email}</a>
			</p>
			{!manualQuote && <>
			<label className="flex items-center gap-3">
				<input type="checkbox" {...register('isBusiness')} disabled={isSubmitting} className="size-5 shrink-0 accent-my-purple" />
				{t('checkout.business')}
			</label>
			{isBusiness && <div className="flex flex-col gap-6">
				<Input required id="companyName" name="companyName" label={t('checkout.companyName')}
					formRegister={register('companyName')} error={errors.companyName || null} message={errors.companyName?.message || null}
					disabled={isSubmitting} autoComplete="organization" placeholder={t('checkout.companyName')} />
				<Input id="vatId" name="vatId" label={t('checkout.vatId')}
					formRegister={register('vatId')} error={errors.vatId || null} message={errors.vatId?.message || null}
					disabled={isSubmitting} autoComplete="off" placeholder="PL1234567890" />
			</div>}
			<div className="w-full grid grid-cols-2 gap-2 xs:gap-3">
				<Input
					required
					type="text"
					id="firstName"
					name="firstName"
					label={t('cart.name')}
					formRegister={register('firstName')}
					error={errors?.firstName || null}
					message={errors?.firstName?.message || null}
					disabled={isSubmitting}
					autoComplete="given-name"
					placeholder={t('cart.name')}
				/>
				<Input
					required
					type="text"
					id="lastName"
					name="lastName"
					label={t('cart.lastName')}
					formRegister={register('lastName')}
					error={errors?.lastName || null}
					message={errors?.lastName?.message || null}
					disabled={isSubmitting}
					autoComplete="family-name"
					placeholder={t('cart.lastName')}
				/>
			</div>
			<Input
				required
				type="text"
				id="address"
				name="address"
				label={t('cart.address')}
				formRegister={register('address')}
				error={errors?.address || null}
				message={errors?.address?.message || null}
				disabled={isSubmitting}
				autoComplete="street-address"
				placeholder={t('cart.address')}
			/>
			<div className="w-full grid grid-cols-2 gap-2 xs:gap-3">
				<Input
					required
					type="text"
					id="zipCode"
					name="zipCode"
					label={t('cart.zipCode')}
					formRegister={register('zipCode')}
					error={errors?.zipCode || null}
					message={errors?.zipCode?.message || null}
					disabled={isSubmitting}
					autoComplete="postal-code"
					placeholder={t('cart.zipCode')}
				/>
				<Input
					required
					type="text"
					id="city"
					name="city"
					label={t('cart.city')}
					formRegister={register('city')}
					error={errors?.city || null}
					message={errors?.city?.message || null}
					disabled={isSubmitting}
					autoComplete="address-level2"
					placeholder={t('cart.city')}
				/>
			</div>
			<div className="w-full grid grid-cols-1 sm:grid-cols-2 sm:gap-3 gap-6">
				<Input
					required
					type="text"
					id="email"
					name="email"
					label={t('cart.email')}
					formRegister={register('email')}
					error={errors?.email || null}
					message={errors?.email?.message || null}
					disabled={isSubmitting}
					autoComplete="email"
					placeholder={t('cart.email')}
				/>
				<Input
					type="text"
					id="instagram"
					name="instagram"
					label={t('cart.instagram')}
					formRegister={register('instagram')}
					error={errors?.instagram || null}
					message={errors?.instagram?.message || null}
					disabled={isSubmitting}
					autoComplete="instagram"
					placeholder={t('cart.instagram')}
				/>
			</div>

			<div className="w-full flex flex-col gap-4">
				<Input
					textarea
					id="message"
					name="message"
					label={t('cart.message')}
					formRegister={register('message')}
					error={errors?.message || null}
					message={errors?.message?.message || null}
					disabled={isSubmitting}
					autoComplete="message"
					placeholder={t('cart.enterMessage')}
				/>
				<Checkbox
					name="terms"
					label={
						<>
							<span>{t('cart.read')}</span>{' '}
							<Link
								target="_blanc"
								rel="noopener noreferrer"
								href={`/${lng}/datenschutzerklarung`}
								className="underline hover:text-black-primary duration-300">
								{' '}
								{t('cart.terms')}
							</Link>
						</>
					}
					formRegister={register('terms')}
					error={errors?.terms || null}
					message={errors?.terms?.message || null}
					disabled={isSubmitting}
				/>
			</div>
			<p
				className={`rounded-full bg-my-purple/7 px-3 min-h-8 py-1.5 flex items-center justify-center text-my-purple text-[13px] leading-5 w-full text-center select-none`}>
				{t('cart.pill')}
			</p>
			<div className="border-t border-grayscale-200 pt-4" aria-live="polite" aria-busy={!currentResult}>
				{!currentResult && <p className="text-sm">{t('checkout.calculating')}</p>}
				{errorCode && <div role="alert" className="flex flex-col gap-3">
					<p className="text-sm text-red-700">{errorMessage(errorCode)}</p>
					<Button type="button" variant="default" disabled={isSubmitting} onClick={() => setQuoteRevision(value => value + 1)}>{t('checkout.retry')}</Button>
				</div>}
				{quote && <dl className="flex flex-col gap-2 text-sm">
					<div className="flex justify-between gap-3"><dt>{t('checkout.netProducts')}</dt><dd className="shrink-0">{money(quote.subtotalCents)}</dd></div>
					<div className="flex justify-between gap-3"><dt>{t('checkout.productVat')} ({quote.vatRate}%)</dt><dd className="shrink-0">{money(quote.productVatCents)}</dd></div>
					<div className="flex justify-between gap-3"><dt>{t('checkout.grossShipping')}</dt><dd className="shrink-0">{money(quote.shippingCents)}</dd></div>
					<div className="flex justify-between gap-3 text-lg mt-2"><dt>{t('cart.total')}</dt><dd className="shrink-0">{money(quote.totalCents)}</dd></div>
					<div className="flex justify-between gap-3 text-grayscale-500"><dt>{t('checkout.includedVat')} ({quote.vatRate}%)</dt><dd className="shrink-0">{money(quote.vatCents)}</dd></div>
					{country === 'DE' && <div className="flex justify-between gap-3 mt-2 text-grayscale-500">
						<dt>{t(quote.shippingCents === 0 ? 'cart.shipping' : 'cart.freeShipping')}</dt>
						<dd className="shrink-0">{quote.shippingCents === 0 ? t('cart.free') : money(toFreeShipping)}</dd>
					</div>}
				</dl>}
				{quote && country === 'DE' && (
					<div
						role="progressbar"
						aria-label={t('cart.freeShipping')}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={freeShippingProgress}
						aria-valuetext={quote.shippingCents === 0 ? `${t('cart.shipping')}: ${t('cart.free')}` : `${t('cart.freeShipping')}: ${money(toFreeShipping)}`}
						className="w-full rounded-full h-[5px] bg-grayscale-200 overflow-hidden mt-4">
						<div
							className="h-full rounded-full bg-my-purple transition-[width] duration-300 motion-reduce:transition-none"
							style={{ width: `${freeShippingProgress}%` }} />
					</div>
				)}
			</div>
			<Button type="submit" variant="primary" restClass="w-full relative" disabled={isSubmitting || !quote}>
				<span className={isSubmitting ? 'invisible' : ''}>{t('cart.order')}</span>
				{isSubmitting && <Spinner restClass="absolute left-1/2 -translate-x-1/2" />}
			</Button>
			</>}
		</form>
	)
}

export default OrderForm
