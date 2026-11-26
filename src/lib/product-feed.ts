import { XMLBuilder } from 'fast-xml-parser'
import translations from '@/app/i18n/locales/de/translations.json'
import { PRODUCT_BRAND, products } from '@/src/data/products'
import { getDiscountedPrice, getGermanGrossPrice } from '@/src/lib/pricing'
import { SITE_URL } from '@/src/lib/seo'

export function productFeedXml() {
	const items = products.map(product => {
		const regularPrice = getGermanGrossPrice(product.price)
		const salePrice = getGermanGrossPrice(getDiscountedPrice(product.price, product.discount))
		return {
			'g:id': product.sku,
			'g:title': translations.products.products[product.name].trim(),
			'g:description': translations.products.description[product.name].trim(),
			'g:link': `${SITE_URL}/de/produkte/${product.slug}`,
			'g:image_link': new URL(product.images[0], SITE_URL).href,
			'g:additional_image_link': product.images.slice(1).map(image => new URL(image, SITE_URL).href),
			'g:availability': product.inStock ? 'in_stock' : 'out_of_stock',
			quantity_to_sell_on_facebook: product.inStock ? 500 : 0,
			'g:condition': 'new',
			'g:price': `${regularPrice.toFixed(2)} EUR`,
			...(salePrice < regularPrice ? { 'g:sale_price': `${salePrice.toFixed(2)} EUR` } : {}),
			'g:brand': PRODUCT_BRAND,
			// The owner confirmed that no GTINs or manufacturer part numbers have been assigned.
			'g:identifier_exists': 'no',
			'g:google_product_category': product.googleProductCategory,
			'g:shipping_weight': `${product.weightGrams} g`,
		}
	})

	return new XMLBuilder({ ignoreAttributes: false, format: true }).build({
		'?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
		rss: {
			'@_version': '2.0',
			'@_xmlns:g': 'http://base.google.com/ns/1.0',
			channel: {
				title: PRODUCT_BRAND,
				link: `${SITE_URL}/de`,
				description: translations.products.subtitle,
				language: 'de-DE',
				item: items,
			},
		},
	})
}
