import { getT } from '@/app/i18n'

import Pill from '@/src/components/ui/Pill'
import { company } from '@/src/data/company'
import type { Metadata, ResolvingMetadata } from 'next'
import type { Params } from '../layout'
import { pageMetadata, SITE_URL } from '@/src/lib/seo'

type PrivacyBlock =
	| { type: 'paragraph'; text: string; bold?: boolean }
	| { type: 'heading'; text: string }
	| { type: 'list'; items: (string | { label: string; text: string })[] }
	| { type: 'contact' }
	| { type: 'link'; href: string; text: string; label?: string }

type PrivacySection = { title: string; blocks: PrivacyBlock[] }

export async function generateMetadata({ params }: { params: Params }, parent: ResolvingMetadata): Promise<Metadata> {
	const { lng } = await params
	return pageMetadata(lng, 'privacy', '/datenschutz', parent)
}

async function page() {
	const { t } = await getT('translations')
	const sections = t('privacyPolicy.sections', { returnObjects: true }) as PrivacySection[]

	return (
		<main id="main-content" tabIndex={-1} className="flex-1">
			<section className="w-full wrapper px-4 mt-24 lg:mt-36 pb-20 lg:pb-30">
				<div className="w-full max-w-[720px] [overflow-wrap:anywhere]">
					<Pill text={t('privacyPolicy.pill')} />
					<h1 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 ">
						{t('privacyPolicy.title')}
					</h1>
					<p className="text-grayscale-500 leading-6 ">{t('privacyPolicy.updated')}</p>
					{sections.map(section => (
						<div key={section.title} className="w-full pt-10">
							<h2 className="text-[32px] leading-10">{section.title}</h2>
							{section.blocks.map((block, index) => {
								switch (block.type) {
									case 'paragraph':
										return (
											<p key={index} className="text-grayscale-500 leading-6 mt-4">
												{block.bold ? <strong>{block.text}</strong> : block.text}
											</p>
										)
									case 'heading':
										return <h3 key={index} className="text-xl leading-8 pt-10">{block.text}</h3>
									case 'list':
										return (
											<ul key={index} className="list-inside list-disc leading-6 text-grayscale-500">
												{block.items.map((item, itemIndex) => (
													<li key={itemIndex}>
														{typeof item === 'string' ? item : <><strong>{item.label}</strong>{' '}{item.text}</>}
													</li>
												))}
											</ul>
										)
									case 'contact':
										return (
											<div key={index} className="flex flex-col">
												<p className="text-black leading-6 mt-4">
													<strong>IWON Nail Display</strong><br />
													{t('privacyPolicy.contact.owner')}: {company.owner}<br />
													{company.street}<br />
													{company.postalCode} {company.city}<br />
													{t('privacyPolicy.contact.country')}
												</p>
												<p className="text-black leading-6 mt-4">
													{t('privacyPolicy.contact.phone')}:{' '}
													<a className="underline" href={company.phoneHref}>{company.phone}</a><br />
													{t('privacyPolicy.contact.email')}:{' '}
													<a className="underline break-all" href={`mailto:${company.email}`}>{company.email}</a><br />
													{t('privacyPolicy.contact.website')}:{' '}
													<a className="underline break-all" href={`${SITE_URL}/`}>{SITE_URL}/</a>
												</p>
											</div>
										)
									case 'link':
										return (
											<p key={index} className="text-grayscale-500 leading-6 mt-4">
												{block.label && <>{block.label}: </>}
												<a className="underline break-all" href={block.href}>{block.text}</a>
											</p>
										)
								}
							})}
						</div>
					))}
				</div>
			</section>
		</main>
	)
}

export default page
