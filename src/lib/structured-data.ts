import { languages } from '@/app/i18n/settings'
import { company } from '@/src/data/company'
import type { Product } from '@/src/data/products'
import { SITE_URL } from '@/src/lib/seo'

export const homepageStructuredData = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'Organization',
			'@id': `${SITE_URL}/#organization`,
			name: company.name,
			alternateName: 'Iwon Nail Display',
			url: `${SITE_URL}/`,
			email: company.email,
			telephone: company.phoneHref.replace('tel:', ''),
			vatID: company.vatId,
			address: {
				'@type': 'PostalAddress',
				streetAddress: company.street,
				postalCode: company.postalCode,
				addressLocality: company.city,
				addressCountry: 'DE',
			},
			sameAs: [
				'https://www.instagram.com/iwonnaildisplay',
				'https://www.facebook.com/iwonnaildisplay',
				'https://www.tiktok.com/@iwonnaildisplay',
			],
		},
		{
			'@type': 'WebSite',
			'@id': `${SITE_URL}/#website`,
			name: 'Iwon Nail Display',
			alternateName: company.name,
			url: `${SITE_URL}/`,
			inLanguage: languages,
			publisher: { '@id': `${SITE_URL}/#organization` },
		},
	],
}

export function productStructuredData(product: Product, lng: string, name: string, description: string) {
	const url = `${SITE_URL}/${lng}/produkte/${product.slug}`

	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		'@id': `${url}#product`,
		url,
		name,
		description,
		image: product.images.map(image => new URL(image, SITE_URL).href),
		brand: { '@type': 'Brand', name: 'Iwon Nail Display' },
		// Offers require a visible VAT-inclusive price; the catalog currently displays net prices.
	}
}

export function serializeJsonLd(data: Record<string, unknown>) {
	return JSON.stringify(data).replace(/</g, '\\u003c')
}
