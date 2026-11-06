import { getT } from '@/app/i18n'

import Pill from '@/src/components/ui/Pill'
import { company } from '@/src/data/company'
import type { Metadata, ResolvingMetadata } from 'next'
import type { Params } from '../layout'
import { pageMetadata, SITE_URL } from '@/src/lib/seo'

export async function generateMetadata({ params }: { params: Params }, parent: ResolvingMetadata): Promise<Metadata> {
	const { lng } = await params
	return pageMetadata(lng, 'impressum', '/impressum', parent)
}

async function page() {
	const { t } = await getT('translations')
	return (
		<main id="main-content" tabIndex={-1} className="flex-1">
			<section className="w-full wrapper px-4 mt-24 lg:mt-36 pb-20 lg:pb-30">
				<div className="w-full max-w-[720px]">
					<Pill text={t('impressum.pill')} />
					<h1 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 ">
						{t('impressum.title')}
					</h1>
					<p className="text-grayscale-500 leading-6 ">{t('impressum.subtitle')}</p>
					<div className="w-full pt-10">
						<h2 className="text-[32px] leading-10">{t('impressum.provider')}</h2>
						<p className="text-black leading-6 mt-4">
							<strong>IWON Nail Display</strong><br />
							{t('impressum.owner')}: {company.owner}<br />
							{company.street}<br />
							{company.postalCode} {company.city}<br />
							{t('impressum.country')}
						</p>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">{t('impressum.contact')}</h2>
						<p className="text-grayscale-500 leading-6 mt-4">
							<strong>{t('impressum.phone')}:</strong>{' '}
							<a className="underline" href={company.phoneHref}>{company.phone}</a><br />
							<strong>{t('impressum.email')}:</strong>{' '}
							<a className="underline break-all" href={`mailto:${company.email}`}>{company.email}</a><br />
							<strong>{t('impressum.website')}:</strong>{' '}
							<a className="underline break-all" href={`${SITE_URL}/`}>{SITE_URL}/</a>
						</p>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">{t('impressum.vatTitle')}</h2>
						<p className="text-grayscale-500 leading-6 mt-4">{t('impressum.vatDescription')}</p>
						<p className="text-black leading-6 mt-4"><strong>{company.vatId}</strong></p>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">{t('impressum.disputeTitle')}</h2>
						<p className="text-grayscale-500 leading-6 mt-4">{t('impressum.disputeDescription')}</p>
					</div>
				</div>
			</section>
		</main>
	)
}

export default page
