'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'
import Input from './Input'
import { useT } from '@/app/i18n/client'
import Checkbox from './Checkbox'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '../stores/CartStore'
import { CartInformation } from './CartModal'
import { toast } from 'react-toastify'

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

	const contactSchema = z.object({
		firstName: z.string().nonempty(t('validation.firstNameRequired')).min(3, t('validation.firstNameMin')),
		lastName: z.string().nonempty(t('validation.lastNameRequired')).min(3, t('validation.lastNameMin')),
		address: z.string().trim().nonempty(t('validation.address')),
		zipCode: z
			.string()
			.trim()
			.nonempty(t('validation.zipCode'))
			.regex(/^(\d{2}-\d{3}|\d{5})$/, t('validation.zipCodeInvalid')),
		city: z.string().trim().nonempty(t('validation.city')).min(2, t('validation.cityMin')),
		email: z.email(t('validation.emailInvalid')),
		instagram: z.string().optional(),
		message: z.string().optional(),
		terms: z.boolean().refine(val => val === true, {
			message: t('validation.termsRequired'),
		}),
	})

	type ContactType = z.infer<typeof contactSchema>

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<ContactType>({ resolver: zodResolver(contactSchema) })

	const onSubmit: SubmitHandler<ContactType> = async data => {
		setIsSubmitting(true)

		try {
			const response = await fetch('/api/order', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					customer: data,
					cart: cartInformation,
					lng,
				}),
			})

			if (!response.ok) {
				throw new Error('Order request failed')
			}

			reset()
			clearCart()
			setStep(3)
		} catch {
			toast.error(t('cart.orderError'))
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form
			className="flex-1 min-h-0  py-4 lg:py-6 flex flex-col gap-6 my-scrollbar"
			onSubmit={handleSubmit(onSubmit)}
			id="order-form">
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
					inputMode="numeric"
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
		</form>
	)
}

export default OrderForm
