'use client'
import { useT } from '@/app/i18n/client'
import { Product } from '@/src/data/products'
import Image from 'next/image'
import Link from 'next/link'
import Button from './Button'
import { useCartStore } from '../stores/CartStore'
import { toast } from 'react-toastify'

function MoreCard({ product, lng }: { product: Product; lng: string }) {
	const { t } = useT('translations')
	const addItem = useCartStore(state => state.addItem)

	const addItemToCart = () => {
		addItem(product)
		toast.success(t('cart.addedToCart'))
	}

	return (
		<div className="flex flex-col gap-2 " data-aos="fade-up" data-aos-delay={100 * product.id}>
			<Link
				href={`/${lng}/produkte/${product.slug}`}
				className="w-full max-h-88 aspect-square lg:aspect-273/350  relative overflow-hidden rounded-2xl lg:rounded-3xl group ">
				<Image
					src={product.images[0]}
					alt={product.name}
					fill
					className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
					sizes="350px"
					loading="eager"
				/>
			</Link>
			<div className="flex items-center flex-col gap-2 ">
				<h3 className="text-lg leading-7 xl:text-xl xl:leading-8 -tracking-[1%] text-grayscale-500 text-center">
					{t(`products.products.${product.name}`)}{' '}
				</h3>
				<p className="text-lg leading-7 xl:text-xl xl:leading-8">
					{product.price.toFixed(2).replace('.', ',')}€{' '}
				</p>
			</div>
			<Button variant="primary" restClass="w-full mt-auto" onClick={addItemToCart}>
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

export default MoreCard
