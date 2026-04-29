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
import Pill from './Pill'

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

	const lng = pathname.slice(0, 3)
	const clearCart = useCartStore(state => state.clearCart)

	const contactSchema = z.object({
		firstName: z.string().nonempty(t('validation.firstNameRequired')).min(3, t('validation.firstNameMin')),
		lastName: z.string().nonempty(t('validation.lastNameRequired')).min(3, t('validation.lastNameMin')),
		email: z.email(t('validation.emailInvalid')),
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
		await new Promise(resolve => setTimeout(resolve, 2000))
		reset()
		clearCart()
		setIsSubmitting(false)
		setStep(3)
	}

	return (
		<form
			className="flex-1 min-h-0  py-4 lg:py-6 flex flex-col gap-6 my-scrollbar"
			onSubmit={handleSubmit(onSubmit)}
			id="order-form">
			<div className="w-full grid grid-cols-2 gap-2 xs:gap-3">
				<Input
					type="text"
					id="firstName"
					name="firstName"
					label={t('cart.name')}
					formRegister={register('firstName')}
					error={errors?.firstName || null}
					message={errors?.firstName?.message || null}
					disabled={isSubmitting}
					autoComplete="firstName"
					placeholder={t('cart.name')}
				/>
				<Input
					type="text"
					id="lastName"
					name="lastName"
					label={t('cart.lastName')}
					formRegister={register('lastName')}
					error={errors?.lastName || null}
					message={errors?.lastName?.message || null}
					disabled={isSubmitting}
					autoComplete="lastName"
					placeholder={t('cart.lastName')}
				/>
			</div>
			<Input
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
								href={`${lng}/datenschutzerklarung`}
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
