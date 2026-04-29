'use client'

import { useT } from '@/app/i18n/client'
import Modal from './Modal'
import Button from './Button'
import useModalStore from '../stores/modalStore'
import { useCartStore } from '../stores/CartStore'
import CartProduct from './CartProduct'
import { useState } from 'react'
import OrderForm from './OrderForm'
import { useFormContext } from 'react-hook-form'
import Spinner from './Spinner'
import LogoLink from './LogoLink'

export type CartInformation = {
	items: {
		name: string
		image: string
		price: number
		quantity: number
	}[]
	totalValue: number
	shipping: number
	totalWithShipping: number
}

function CartModal() {
	const { t } = useT('translations')
	const closeModal = useModalStore(state => state.closeModal)
	const [step, setStep] = useState(1)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const items = useCartStore(state => state.items)

	const totalValue = useCartStore(state => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0))

	const shipping = totalValue >= 150 ? 0 : 15
	const totalWithShipping = totalValue + shipping
	const toFreeShipping = Math.max(0, 150 - totalValue)

	const progress = Math.min(100, (totalValue / 150) * 100)

	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000'

	const cartInformation: CartInformation = {
		items: items.map(item => ({
			name: t(`products.products.${item.name}`),
			image: `${baseUrl}${item.image}`,
			price: item.price,
			quantity: item.quantity,
		})),
		totalValue: parseFloat(totalValue.toFixed(2)),
		shipping,
		totalWithShipping: parseFloat(totalWithShipping.toFixed(2)),
	}

	return (
		<Modal>
			<div
				className={`w-screen p-4 sm:p-8 flex flex-col min-h-full overflow-x-hidden   lg:flex-1 bg-white ${step === 1 ? 'sm:max-w-[424px] xl:max-h-full' : 'sm:max-w-[484px] '}`}>
				<div className="flex items-center justify-between gap-2 pb-4 sm:pb-6 border-b border-grayscale-200">
					<h2 className="sm:text-xl sm:leading-8  leading-6">
						{' '}
						{step === 1 ? t('cart.title') : step === 2 ? t('cart.orderTitle') : t('cart.successTitle')}
					</h2>
					<Button
						variant="default"
						restClass="text-my-purple hover:text-my-purple/80 transition-colors sm:p-1 rounded-full hover:bg-grayscale-100"
						aria-label={t('cart.closeModal')}
						onClick={() => {
							if (step === 2) {
								setStep(1)
							} else {
								closeModal()
							}
						}}>
						{step === 1 ? (
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className="pointer-events-none">
								<path
									d="M6 6L18 18"
									stroke="currentColor"
									strokeWidth="1.25"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M18 6L6 18"
									stroke="currentColor"
									strokeWidth="1.25"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						) : (
							<svg
								width="24px"
								height="24px"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className="rotate-180">
								<g id="Arrow / Arrow_Right_SM">
									<path
										id="Vector"
										d="M7 12H17M17 12L13 8M17 12L13 16"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</g>
							</svg>
						)}
					</Button>
				</div>
				{step === 1 && (
					<div className="lg:flex-1 min-h-0 lg:overflow-y-auto py-4 lg:py-6 flex flex-col gap-6 my-scrollbar">
						{items.length > 0 ? (
							items.map(product => <CartProduct product={product} key={product.id} />)
						) : (
							<p className="text-grayscale-500 text-center">{t('cart.empty')}</p>
						)}
					</div>
				)}
				{step === 2 && (
					<OrderForm
						cartInformation={cartInformation}
						isSubmitting={isSubmitting}
						setIsSubmitting={setIsSubmitting}
						setStep={setStep}
					/>
				)}
				{items.length > 0 && (
					<div className="mt-auto flex flex-col w-full pt-4">
						<p className="w-full flex justify-between gap-2 items-center leading-6 mb-2">
							<span className="text-grayscale-500">{t('cart.value')}:</span>
							<span>{totalValue.toFixed(2).replace('.', ',')}€</span>
						</p>
						<p className="w-full flex justify-between gap-2 items-center leading-6 mb-6">
							<span className="text-grayscale-500">{t('cart.shipping')}:</span>
							{shipping === 0 ? (
								<span>{t('cart.free')}</span>
							) : (
								<span>{shipping.toFixed(2).replace('.', ',')}€</span>
							)}
						</p>
						<p className="w-full flex justify-between gap-2 items-center leading-8 mb-4 text-xl">
							<span>{t('cart.total')}:</span>
							<span>{totalWithShipping.toFixed(2).replace('.', ',')}€</span>
						</p>
						{step === 1 ? (
							<Button
								variant="primary"
								type="button"
								restClass="w-full mb-4"
								onClick={e => {
									e.preventDefault()
									setStep(2)
								}}>
								{t('cart.quote')}
								<svg
									width="20px"
									height="20px"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg">
									<g id="Arrow / Arrow_Right_SM">
										<path
											id="Vector"
											d="M7 12H17M17 12L13 8M17 12L13 16"
											stroke="#FFFFFF"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</g>
								</svg>
							</Button>
						) : (
							<Button
								variant="primary"
								restClass="w-full mb-4"
								type="submit"
								form="order-form"
								disabled={isSubmitting}>
								<span className={` flex items-center   ${isSubmitting ? 'invisible' : 'visible'}`}>
									{t('cart.order')}{' '}
									<svg
										width="20px"
										height="20px"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg">
										<g id="Arrow / Arrow_Right_SM">
											<path
												id="Vector"
												d="M7 12H17M17 12L13 8M17 12L13 16"
												stroke="#FFFFFF"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</g>
									</svg>
								</span>{' '}
								{isSubmitting && <Spinner restClass="absolute left-1/2 -translate-x-1/2" />}
							</Button>
						)}
						<div className="w-full flex flex-col pt-4 border-t border-grayscale-200">
							<p className="w-full flex justify-between gap-2 items-center leading-6 mb-2">
								<span className="text-grayscale-500">{t('cart.freeShipping')}:</span>
								{shipping === 0 ? (
									<span>{t('cart.free')}</span>
								) : (
									<span className="text-black-primary">
										{toFreeShipping.toFixed(2).replace('.', ',')}€
									</span>
								)}
							</p>
							<div className="w-full rounded-full h-[5px] bg-grayscale-200 relative overflow-hidden mb-4">
								<div
									className="h-full absolute transition-all duration-300 rounded-full w-full top-0 left-0 bg-my-purple"
									style={{ maxWidth: `${progress}%` }}></div>
							</div>
							<p className="text-center text-grayscale-500 text-sm leading-5 opacity-50">
								{t('cart.shippingInfo')}
							</p>
						</div>
					</div>
				)}
				{step === 3 && (
					<div className="flex-1  py-4 lg:py-6 flex flex-col w-full justify-center items-center text-center">
						<div className="pointer-events-none mb-8">
							<LogoLink />
						</div>
						<h3 className="text-center text-3xl leading-8 mb-2">{t('cart.thankYou')} 🎉</h3>
						<p className="text-grayscale-500 text-xl leading-6 mb-4">{t('cart.subtitle')}</p>
						<p className="text-grayscale-500  leading-6 mb-4 ">{t('cart.emailSend')}</p>
						<p className="text-grayscale-500 text-sm leading-6 mb-6 ">{t('cart.spam')}</p>
						<p className=" text-lg leading-6 mb-6 ">{t('cart.thanks')}</p>

						<Button
							variant="primary"
							type="button"
							restClass="w-full "
							onClick={() => {
								closeModal()
							}}>
							{t('cart.close')}
						</Button>
					</div>
				)}
			</div>
		</Modal>
	)
}

export default CartModal
