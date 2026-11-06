import { getT } from '@/app/i18n'

import Pill from '@/src/components/ui/Pill'
import { company } from '@/src/data/company'
import type { Metadata, ResolvingMetadata } from 'next'
import type { Params } from '../layout'
import { pageMetadata } from '@/src/lib/seo'

type ShippingBlock =
	| { type: 'paragraph'; text: string | (string | { strong: string })[]; bold?: boolean; italic?: boolean }
	| { type: 'heading'; text: string }
	| { type: 'rates'; rows: { weight: number; cents: number }[]; vatIncluded?: boolean }
	| { type: 'list'; items: string[] }
	| { type: 'email' }
	| { type: 'contact' }

type ShippingSection = { title: string; blocks: ShippingBlock[] }

export async function generateMetadata({ params }: { params: Params }, parent: ResolvingMetadata): Promise<Metadata> {
	const { lng } = await params
	return pageMetadata(lng, 'versand-zahlung', '/versand-zahlung', parent)
}

async function page({ params }: { params: Params }) {
	const { lng } = await params
	const { t } = await getT('translations')
	const sections = t('shippingPayment.sections', { returnObjects: true }) as ShippingSection[]
	const money = new Intl.NumberFormat(lng, { style: 'currency', currency: 'EUR' })

	return (
		<main id="main-content" tabIndex={-1} className="flex-1">
			<section className="w-full wrapper px-4 mt-24 lg:mt-36 pb-20 lg:pb-30">
				<div className="w-full max-w-[720px] [overflow-wrap:anywhere]">
					<Pill text={t('shippingPayment.pill')} />
					<h1 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 ">
						{t('shippingPayment.title')}
					</h1>
					<p className="text-grayscale-500 leading-6 ">{t('shippingPayment.subtitle')}</p>
					{sections.map(section => (
						<div key={section.title} className="w-full pt-10">
							<h2 className="text-[32px] leading-10">{section.title}</h2>
							{section.blocks.map((block, index) => {
								switch (block.type) {
									case 'paragraph': {
										const text = Array.isArray(block.text)
											? block.text.map((part, partIndex) => typeof part === 'string' ? part : <strong key={partIndex}>{part.strong}</strong>)
											: block.text
										return (
											<p key={index} className="text-grayscale-500 leading-6 mt-4">
												{block.bold ? <strong>{text}</strong> : block.italic ? <em>{text}</em> : text}
											</p>
										)
									}
									case 'heading':
										return <h3 key={index} className="text-xl leading-8 pt-10">{block.text}</h3>
									case 'rates':
										return (
											<table key={index} className="w-full table-fixed border-collapse text-left text-grayscale-500 leading-6 mt-4">
												<caption className="sr-only">{section.title}</caption>
												<thead>
													<tr className="border-b border-grayscale-200">
														<th scope="col" className="py-2 pr-4 font-medium">{t('shippingPayment.weightHeader')}</th>
														<th scope="col" className="py-2 font-medium">{t('shippingPayment.costHeader')}</th>
													</tr>
												</thead>
												<tbody>
													{block.rows.map(row => (
														<tr key={row.weight} className="border-b border-grayscale-200">
															<th scope="row" className="py-2 pr-4 font-normal">{t('shippingPayment.upTo', { weight: row.weight })}</th>
															<td className="py-2">
																{money.format(row.cents / 100)}
																{block.vatIncluded && <> {t('shippingPayment.includingVat')}</>}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										)
									case 'list':
										return (
											<ul key={index} className="list-inside list-disc leading-6 text-grayscale-500">
												{block.items.map(item => <li key={item}>{item}</li>)}
											</ul>
										)
									case 'email':
										return (
											<p key={index} className="text-grayscale-500 leading-6 mt-4">
												<strong><a className="underline break-all" href={`mailto:${company.email}`}>{company.email}</a></strong>
											</p>
										)
									case 'contact':
										return (
											<div key={index} className="flex flex-col">
												<p className="text-black leading-6 mt-4">
													<strong>IWON Nail Display</strong><br />
													{t('shippingPayment.contact.owner')}: {company.owner}<br />
													{company.street}<br />
													{company.postalCode} {company.city}<br />
													{t('shippingPayment.contact.country')}
												</p>
												<p className="text-black leading-6 mt-4">
													<strong>{t('shippingPayment.contact.email')}:</strong>{' '}
													<a className="underline break-all" href={`mailto:${company.email}`}>{company.email}</a><br />
													<strong>{t('shippingPayment.contact.phone')}:</strong>{' '}
													<a className="underline" href={company.phoneHref}>{company.phone}</a>
												</p>
											</div>
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
