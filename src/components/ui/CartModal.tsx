'use client'

import { useT } from '@/app/i18n/client'
import Modal from './Modal'
import Button from './Button'
import useModalStore from '../stores/modalStore'
import { useCartStore } from '../stores/CartStore'
import CartProduct from './CartProduct'
import { useState } from 'react'
import OrderForm from './OrderForm'
import LogoLink from './LogoLink'
import CompatibleProducts from './CompatibleProducts'
import { products } from '@/src/data/products'

export type CartInformation = {
	items: {
		id: number
		quantity: number
	}[]
}

function CartModal() {
	const { t } = useT('translations')
	const closeModal = useModalStore(state => state.closeModal)
	const [step, setStep] = useState(1)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const items = useCartStore(state => state.items)

	const totalValue = items.reduce((sum, item) => sum + Math.round((products.find(product => product.id === item.id)?.price || 0) * 100) * item.quantity, 0) / 100

	const cartInformation: CartInformation = {
		items: items.map(item => ({
			id: item.id,
			quantity: item.quantity,
		})),
	}

	return (
		<Modal>
			<div
				className={`w-screen p-4 sm:p-8 flex flex-col min-h-full overflow-x-hidden   lg:flex-1 bg-white ${step === 1 ? 'sm:max-w-[424px] xl:max-h-full' : 'sm:max-w-[484px] '}`}>
				<div className="flex items-center justify-between gap-2 pb-4 sm:pb-6 border-b border-grayscale-200">
					<h2 className="sm:text-xl sm:leading-8  leading-6">
						{' '}
						{step === 1 && t('cart.title')} {step === 2 && t('cart.orderTitle')}{' '}
						{step === 3 && t('cart.successTitle')}
						{step === 4 && t('compatible.title')}
					</h2>
					<Button
						variant="default"
						restClass="text-my-purple hover:text-my-purple/80 transition-colors sm:p-1 rounded-full hover:bg-grayscale-100"
						aria-label={t('cart.closeModal')}
						onClick={() => {
							if (step === 2 || step === 4) {
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
							<>
								{items.map(product => (
									<CartProduct product={product} key={product.id} />
								))}{' '}
								<div className="pt-6 border-t border-grayscale-200 w-full">
									<Button
										onClick={() => setStep(4)}
										variant="default"
										restClass="w-full h-10 bg-grayscale-100 transition-colors hover:bg-grayscale-100/70 text-grayscale-500 text-sm leading-5 font-medium rounded-2xl">
										{t('compatible.compatible')}
									</Button>
								</div>
							</>
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

				{step === 4 && <CompatibleProducts onClick={() => setStep(1)} />}

				{step === 1 && items.length > 0 && (
					<div className="mt-auto flex flex-col w-full pt-4 gap-4">
						<p className="w-full flex justify-between gap-3 items-center leading-6">
							<span className="text-grayscale-500">{t('checkout.netProducts')}:</span>
							<span className="shrink-0">{totalValue.toFixed(2).replace('.', ',')} EUR</span>
						</p>
						<Button variant="primary" type="button" restClass="w-full mb-4" onClick={() => setStep(2)}>
							{t('cart.quote')}
						</Button>
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
