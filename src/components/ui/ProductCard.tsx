'use client'
import { useT } from '@/app/i18n/client'
import Image from 'next/image'
import LinkButton from './LinkButton'
import Button from './Button'
import Link from 'next/link'
import { Product } from '@/src/data/products'
import { useCartStore } from '../stores/CartStore'
import { toast } from 'react-toastify'

function ProductCard({ item, lng }: { item: Product; lng: string }) {
	const { t } = useT('translations')

	const addItem = useCartStore(state => state.addItem)
	const addItemToCart = () => {
		addItem(item)
		toast.success(t('cart.addedToCart'))
	}

	return (
		<div
			className="flex flex-col max-w-[364px] w-full mx-auto gap-4"
			data-aos="fade-up"
			data-aos-delay={100 * item.id}>
			<Link
				href={`/${lng}/produkte/${item.slug}`}
				className="w-full max-h-115 aspect-364/460  relative overflow-hidden rounded-2xl lg:rounded-3xl group ">
				<Image
					src={item.images[0]}
					alt={item.name}
					fill
					className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
					sizes="364px"
					loading="eager"
					fetchPriority="high"
				/>
			</Link>
			<div className="flex items-center gap-2 justify-between">
				<h2 className="text-xl leading-8 -tracking-[1%] text-grayscale-500">
					{t(`products.products.${item.name}`)}{' '}
				</h2>
				<p className="text-xl leading-8">{item.price.toFixed(2).replace('.', ',')}€ </p>
			</div>
			<div className="grid grid-cols-2 gap-3 ">
				<LinkButton href={`/${lng}/produkte/${item.slug}`} variant="secondary">
					{t('products.details')}
					<svg
						width="20px"
						height="20px"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="shrink-0">
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
				</LinkButton>
				<Button variant="primary" onClick={addItemToCart}>
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
		</div>
	)
}

export default ProductCard
