import type { Product } from '@/src/data/products'
import { getDiscountedPrice, getGermanGrossPrice } from '@/src/lib/pricing'

export default function ProductPrice({ product, regularPriceLabel, salePriceLabel }: {
	product: Pick<Product, 'price' | 'discount'>
	regularPriceLabel: string
	salePriceLabel: string
}) {
	const regularPrice = getGermanGrossPrice(product.price)
	const salePrice = getGermanGrossPrice(getDiscountedPrice(product.price, product.discount))
	const onSale = salePrice < regularPrice
	const formatPrice = (price: number) => `${price.toFixed(2).replace('.', ',')}\u20ac`

	return (
		<span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
			{onSale && (
				<del className="text-[0.75em] text-grayscale-500 whitespace-nowrap">
					<span className="sr-only">{regularPriceLabel}: </span>
					{formatPrice(regularPrice)}
				</del>
			)}
			<span className={onSale ? 'text-[#b3263e] font-medium whitespace-nowrap' : 'whitespace-nowrap'}>
				{onSale && <span className="sr-only">{salePriceLabel}: </span>}
				{formatPrice(salePrice)}
			</span>
		</span>
	)
}
