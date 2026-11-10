import { getT } from '@/app/i18n'

import Pill from '@/src/components/ui/Pill'
import { company } from '@/src/data/company'
import Link from 'next/link'
import type { Metadata, ResolvingMetadata } from 'next'
import type { Params } from '../layout'
import { pageMetadata } from '@/src/lib/seo'

type ComplaintBlock =
	| { type: 'paragraph'; text: string; label?: string }
	| { type: 'heading'; text: string }
	| { type: 'list'; items: (string | { label: string; text: string })[]; ordered?: boolean }
	| { type: 'email' | 'phone' | 'contact' }
	| { type: 'withdrawalLink'; text: string }

type ComplaintSection = { title: string; blocks: ComplaintBlock[] }

export async function generateMetadata({ params }: { params: Params }, parent: ResolvingMetadata): Promise<Metadata> {
	const { lng } = await params
	return pageMetadata(lng, 'reklamation', '/reklamation', parent)
}

async function page({ params }: { params: Params }) {
	const { lng } = await params
	const { t } = await getT('translations')
	const intro = t('complaints.intro', { returnObjects: true }) as string[]
	const sections = t('complaints.sections', { returnObjects: true }) as ComplaintSection[]

	return (
		<main id="main-content" tabIndex={-1} className="flex-1">
			<section className="w-full wrapper px-4 mt-24 lg:mt-36 pb-20 lg:pb-30">
				<div className="w-full max-w-[720px] [overflow-wrap:anywhere]">
					<Pill text={t('complaints.pill')} />
					<h1 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 ">
						{t('complaints.title')}
					</h1>
					<p className="text-black leading-6 mb-4"><strong>IWON Nail Display</strong></p>
					{intro.map((paragraph, index) => (
						<p key={paragraph} className={`text-grayscale-500 leading-6 ${index > 0 ? 'mt-4' : ''}`}>{paragraph}</p>
					))}
					<p className="text-grayscale-500 leading-6 mt-4">
						<Link className="underline" href={`/${lng}/reklamation/formular`}>{t('complaintForm.title')}</Link>
					</p>
					{sections.map(section => (
						<div key={section.title} className="w-full pt-10">
							<h2 className="text-[32px] leading-10">{section.title}</h2>
							{section.blocks.map((block, index) => {
								switch (block.type) {
									case 'paragraph':
										return (
											<p key={index} className="text-grayscale-500 leading-6 mt-4">
												{block.label && <><strong>{block.label}</strong>{' '}</>}{block.text}
											</p>
										)
									case 'heading':
										return <h3 key={index} className="text-xl leading-8 pt-10">{block.text}</h3>
									case 'list': {
										const List = block.ordered ? 'ol' : 'ul'
										return (
											<List key={index} className={`list-inside ${block.ordered ? 'list-decimal' : 'list-disc'} leading-6 text-grayscale-500`}>
												{block.items.map((item, itemIndex) => (
													<li key={itemIndex}>
														{typeof item === 'string' ? item : <><strong>{item.label}</strong>{' '}{item.text}</>}
													</li>
												))}
											</List>
										)
									}
									case 'email':
									case 'phone':
										return (
											<p key={index} className="text-grayscale-500 leading-6 mt-4">
												<strong>
													<a className="underline break-all" href={block.type === 'email' ? `mailto:${company.email}` : company.phoneHref}>
														{block.type === 'email' ? company.email : company.phone}
													</a>
												</strong>
											</p>
										)
									case 'contact':
										return (
											<div key={index} className="flex flex-col">
												<p className="text-black leading-6 mt-4">
													<strong>IWON Nail Display</strong><br />
													{t('complaints.contact.owner')}: {company.owner}<br />
													{company.street}<br />
													{company.postalCode} {company.city}<br />
													{t('complaints.contact.country')}
												</p>
												<p className="text-black leading-6 mt-4">
													<strong>{t('complaints.contact.email')}:</strong>{' '}
													<a className="underline break-all" href={`mailto:${company.email}`}>{company.email}</a><br />
													<strong>{t('complaints.contact.phone')}:</strong>{' '}
													<a className="underline" href={company.phoneHref}>{company.phone}</a>
												</p>
											</div>
										)
									case 'withdrawalLink':
										return (
											<p key={index} className="text-grayscale-500 leading-6 mt-4">
												<Link className="underline" href={`/${lng}/widerruf`}>{block.text}</Link>
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
