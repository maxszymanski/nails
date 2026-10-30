import HomeHeader from '@/src/components/homepage/HomeHeader.'

import { Params } from './layout'
import VideoSection from '@/src/components/homepage/VideoSection'
import ProductsSection from '@/src/components/homepage/ProductsSection'
import ChoiceSection from '@/src/components/homepage/ChoiceSection'
import OptionsSection from '@/src/components/homepage/OptionsSection'
import OrganizationSection from '@/src/components/homepage/OrganizationSection'
import type { Metadata, ResolvingMetadata } from 'next'
import { languageAlternates, SITE_URL } from '@/src/lib/seo'
import JsonLd from '@/src/components/ui/JsonLd'
import { homepageStructuredData } from '@/src/lib/structured-data'

const homepageMetadata = {
	de: {
		title: 'Iwon Nail Display | Displays & Mustertips',
		description:
			'Entdecken Sie modulare Nagellack-Displays, abnehmbare Mustertips und Organizer von Iwon Nail Display. Für eine übersichtliche Farbpräsentation im Nagelstudio.',
		locale: 'de_DE',
	},
	en: {
		title: 'Iwon Nail Display | Displays & Sample Tips',
		description:
			'Discover modular nail colour displays, removable sample tips and organisers from Iwon Nail Display. Help your salon present shades and make colour selection easier.',
		locale: 'en_GB',
	},
	pl: {
		title: 'Iwon Nail Display | Ekspozytory i wzorniki',
		description:
			'Poznaj modułowe ekspozytory, zdejmowane tipsy wzornikowe i organizery Iwon Nail Display. Uporządkuj kolory w salonie i ułatw klientkom wybór odcienia.',
		locale: 'pl_PL',
	},
}

export async function generateMetadata({ params }: { params: Params }, parent: ResolvingMetadata): Promise<Metadata> {
	const { lng } = await params
	const { title, description, locale } =
		homepageMetadata[lng as keyof typeof homepageMetadata] ?? homepageMetadata.en
	const images = (await parent).openGraph?.images ?? []
	const url = `${SITE_URL}/${lng}`

	return {
		title: { absolute: title },
		description,
		alternates: {
			canonical: url,
			languages: languageAlternates(),
		},
		openGraph: {
			type: 'website',
			siteName: 'Iwon Nail Display',
			title,
			description,
			url,
			locale,
			alternateLocale: Object.values(homepageMetadata)
				.map(meta => meta.locale)
				.filter(value => value !== locale),
			images,
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images,
		},
	}
}

export default async function Home({ params }: { params: Params }) {
	const { lng } = await params

	return (
		<main id="main-content" tabIndex={-1}>
			<JsonLd data={homepageStructuredData} />
			<HomeHeader lng={lng} />
			<VideoSection />
			<ProductsSection lng={lng} />
			<ChoiceSection lng={lng} />
			<OptionsSection lng={lng} />
			<OrganizationSection lng={lng} />
		</main>
	)
}
