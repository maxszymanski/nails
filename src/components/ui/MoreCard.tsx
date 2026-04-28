'use client'
import { useT } from '@/app/i18n/client'
import { Product } from '@/src/data/products'
import Image from 'next/image'
import Link from 'next/link'

function MoreCard({ product, lng }: { product: Product; lng: string }) {
	const { t } = useT('translations')
	return (
		<div className="flex flex-col gap-2">
			<Link
				href={`/${lng}/produkte/${product.slug}`}
				className="w-full max-h-88 aspect-273/350  relative overflow-hidden rounded-2xl lg:rounded-3xl group ">
				<Image
					src={product.images[0]}
					alt={product.name}
					fill
					className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
					sizes="350px"
					loading="eager"
				/>
			</Link>
			<div className="flex items-center gap-2 justify-between">
				<h3 className="text-xl leading-8 -tracking-[1%] text-grayscale-500">
					{t(`products.products.${product.name}`)}{' '}
				</h3>
				<p className="text-xl leading-8">{product.price.toFixed(2).replace('.', ',')}€ </p>
			</div>
		</div>
	)
}

export default MoreCard
