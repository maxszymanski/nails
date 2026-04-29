'use client'
import Image from 'next/image'
import { CartItem, useCartStore } from '../stores/CartStore'
import { useT } from '@/app/i18n/client'
import Button from './Button'

function CartProduct({ product }: { product: CartItem }) {
	const { t } = useT('translations')

	const increase = useCartStore(state => state.increase)
	const decrease = useCartStore(state => state.decrease)
	const remove = useCartStore(state => state.remove)

	const totalPrice = product.price * product.quantity

	return (
		<div className="w-full flex gap-6 items-center">
			<div className=" size-26 shrink-0 aspect-square relative overflow-hidden rounded-2xl  ">
				<Image
					src={product.image}
					alt={product.name}
					fill
					className="object-cover object-center "
					sizes="104px"
					loading="eager"
				/>
			</div>
			<div className="flex flex-col ">
				<h3 className="leading-6 text-grayscale-500 ">{t(`products.products.${product.name}`)} </h3>
				<p className="leading-6 ">{totalPrice.toFixed(2).replace('.', ',')}€ </p>
				<div
					className={`flex items-center rounded-full bg-grayscale-100 overflow-hidden  w-[117px] h-10 gap-2 shrink-0 mt-4`}>
					<Button
						variant="default"
						aria-label="increase items"
						restClass=" text-grayscale-500 h-full w-full  hover:bg-grayscale-200 disabled:cursor-auto disabled:hover:bg-transparent"
						disabled={product.quantity === 1}
						onClick={() => decrease(product.id)}>
						<svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M3.33268 8.66781H7.33335H8.66668H12.6673L12.7357 8.66461C13.0717 8.63034 13.334 8.34627 13.334 8.00114C13.334 7.65607 13.0717 7.37201 12.7357 7.33774L12.6673 7.33447H8.66668H7.33335H3.33268C2.9645 7.33447 2.66602 7.63301 2.66602 8.00114C2.66602 8.36934 2.9645 8.66781 3.33268 8.66781Z"
								fill="currentColor"
							/>
						</svg>
					</Button>
					<span className="size-5 shrink-0 inline-flex items-center justify-center text-sm leading-6 select-none">
						{product.quantity}
					</span>
					<Button
						variant="default"
						aria-label="decrease items"
						restClass=" text-grayscale-500 h-full  w-full hover:bg-grayscale-200 disabled:cursor-auto disabled:pointer-events-none disabled:opacity-50"
						onClick={() => increase(product.id)}>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="pointer-events-none">
							<path
								d="M7.33335 12.6683V8.66826H3.33268C2.9645 8.66826 2.66602 8.3698 2.66602 8.0016C2.66602 7.63346 2.9645 7.33493 3.33268 7.33493H7.33335V3.33366C7.33335 2.96547 7.63182 2.66699 8.00002 2.66699C8.36822 2.667 8.66668 2.96547 8.66668 3.33366V7.33493H12.6673L12.7357 7.3382C13.0717 7.37247 13.334 7.65653 13.334 8.0016C13.334 8.34673 13.0717 8.6308 12.7357 8.66507L12.6673 8.66826H8.66668V12.6683C8.66668 13.0365 8.36822 13.3349 8.00002 13.3349C7.63182 13.3349 7.33335 13.0365 7.33335 12.6683Z"
								fill="currentColor"
							/>
						</svg>
					</Button>
				</div>
			</div>
			<Button
				variant="default"
				restClass="text-grayscale-500 transition-colors sm:p-1 rounded-full hover:bg-grayscale-100 ml-auto"
				aria-label={t('cart.remove')}
				title={t('cart.remove')}
				onClick={() => remove(product.id)}>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="pointer-events-none">
					<path
						d="M17.5994 7.2V18.4C17.5994 18.8243 17.4308 19.2313 17.1308 19.5314C16.8307 19.8314 16.4238 20 15.9994 20H7.99941C7.57507 20 7.1681 19.8314 6.86804 19.5314C6.56798 19.2313 6.39941 18.8243 6.39941 18.4V7.2"
						stroke="currentColor"
						strokeWidth="1.25"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M4.7998 7.2H19.1998"
						stroke="currentColor"
						strokeWidth="1.25"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M8.7998 7.2V5.6C8.7998 5.17565 8.96838 4.76869 9.26843 4.46863C9.56849 4.16857 9.97546 4 10.3998 4H13.5998C14.0242 4 14.4311 4.16857 14.7312 4.46863C15.0312 4.76869 15.1998 5.17565 15.1998 5.6V7.2"
						stroke="currentColor"
						strokeWidth="1.25"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>{' '}
			</Button>
		</div>
	)
}

export default CartProduct
{
	/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.5994 7.2V18.4C17.5994 18.8243 17.4308 19.2313 17.1308 19.5314C16.8307 19.8314 16.4238 20 15.9994 20H7.99941C7.57507 20 7.1681 19.8314 6.86804 19.5314C6.56798 19.2313 6.39941 18.8243 6.39941 18.4V7.2" stroke="#565656" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M4.7998 7.2H19.1998" stroke="#565656" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.7998 7.2V5.6C8.7998 5.17565 8.96838 4.76869 9.26843 4.46863C9.56849 4.16857 9.97546 4 10.3998 4H13.5998C14.0242 4 14.4311 4.16857 14.7312 4.46863C15.0312 4.76869 15.1998 5.17565 15.1998 5.6V7.2" stroke="#565656" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg> */
}
