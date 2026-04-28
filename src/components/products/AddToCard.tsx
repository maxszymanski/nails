'use client'
import { Product } from '@/src/data/products'
import Button from '../ui/Button'
import { useT } from '@/app/i18n/client'

function AddToCard({ product }: { product: Product }) {
	const { t } = useT('translations')
	return (
		<div className="flex items-center gap-4 mb-6 lg:mb-12">
			<div
				className={`flex items-center rounded-full bg-grayscale-100 overflow-hidden  w-[117px] h-10 gap-2 shrink-0`}>
				<Button
					variant="default"
					aria-label="increase items"
					restClass=" text-grayscale-500 h-full w-full  hover:bg-grayscale-200"
					// onClick={() => handleDecrease(item.id)}
				>
					<svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M3.33268 8.66781H7.33335H8.66668H12.6673L12.7357 8.66461C13.0717 8.63034 13.334 8.34627 13.334 8.00114C13.334 7.65607 13.0717 7.37201 12.7357 7.33774L12.6673 7.33447H8.66668H7.33335H3.33268C2.9645 7.33447 2.66602 7.63301 2.66602 8.00114C2.66602 8.36934 2.9645 8.66781 3.33268 8.66781Z"
							fill="currentColor"
						/>
					</svg>
				</Button>
				<span className="size-5 shrink-0 inline-flex items-center justify-center text-sm leading-6 select-none">
					{/* {quantity} */} 1
				</span>
				<Button
					variant="default"
					aria-label="decrease items"
					restClass=" text-grayscale-500 h-full  w-full hover:bg-grayscale-200 disabled:cursor-auto disabled:pointer-events-none disabled:opacity-50"
					// onClick={() => handleIncrease(item.id)}
				>
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
			<Button variant="primary" restClass="w-full">
				{t('products.add')}
				<svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
		</div>
	)
}

export default AddToCard
