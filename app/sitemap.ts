import type { MetadataRoute } from 'next'
import { languages } from '@/app/i18n/settings'
import { products } from '@/src/data/products'
import { languageAlternates, SITE_URL } from '@/src/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
	const paths = ['', '/produkte', '/faq', '/datenschutzerklarung', ...products.map(product => `/produkte/${product.slug}`)]

	return paths.flatMap(path => languages.map(lng => ({
		url: `${SITE_URL}/${lng}${path}`,
		alternates: { languages: languageAlternates(path) },
	})))
}
