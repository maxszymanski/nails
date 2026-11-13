import type { Metadata } from 'next'
import { getT } from '@/app/i18n'
import type { Params } from '../layout'
import MetaCheckout from '@/src/components/ui/MetaCheckout'
import { parseMetaCheckout, type MetaCheckoutParams } from '@/src/lib/meta-checkout'
import { SITE_URL } from '@/src/lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
	const { lng } = await params
	const { t } = await getT('translations')
	return {
		title: { absolute: `${t('metaCheckout.title')} | Iwon Nail Display` },
		robots: { index: false, follow: true },
		alternates: { canonical: `${SITE_URL}/${lng}/meta-checkout` },
	}
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: Promise<MetaCheckoutParams> }) {
	const { lng } = await params
	const query = await searchParams
	const { t } = await getT('translations')
	const result = parseMetaCheckout(query)
	return (
		<main id="main-content" tabIndex={-1} className="flex-1">
			<section className="w-full wrapper px-4 mt-24 lg:mt-36 pb-20 lg:pb-30">
				<div className="w-full max-w-[720px] mx-auto [overflow-wrap:anywhere]">
					<h1 className="leading-12 text-[40px] md:text-5xl md:leading-14 mb-10">{t('metaCheckout.title')}</h1>
					<MetaCheckout key={JSON.stringify([lng, query.products, query.coupon])} result={result} lng={lng} />
				</div>
			</section>
		</main>
	)
}
