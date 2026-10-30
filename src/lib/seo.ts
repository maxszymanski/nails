import { fallbackLng, languages } from '@/app/i18n/settings'
import type { Metadata, ResolvingMetadata } from 'next'
import { pageSeo } from '@/src/data/seo'

export const SITE_URL = 'https://www.iwonnaildisplay.de'

export function languageAlternates(path = '') {
	return {
		...Object.fromEntries(languages.map(lng => [lng, `${SITE_URL}/${lng}${path}`])),
		'x-default': `${SITE_URL}/${fallbackLng}${path}`,
	}
}

export async function pageMetadata(lng: string, key: keyof typeof pageSeo.en, path: string, parent: ResolvingMetadata): Promise<Metadata> {
	const copy = pageSeo[lng as keyof typeof pageSeo] ?? pageSeo[fallbackLng as keyof typeof pageSeo]
	const title = `${copy[key].title} | Iwon Nail Display`
	const description = copy[key].description
	const url = `${SITE_URL}/${lng}${path}`
	const images = (await parent).openGraph?.images ?? []

	return {
		title: { absolute: title },
		description,
		alternates: { canonical: url, languages: languageAlternates(path) },
		openGraph: { type: 'website', siteName: 'Iwon Nail Display', title, description, url, images },
		twitter: { card: 'summary_large_image', title, description, images },
	}
}
