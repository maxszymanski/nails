import { getT } from '@/app/i18n'

import Pill from '@/src/components/ui/Pill'
import { company } from '@/src/data/company'
import Link from 'next/link'
import type { Metadata, ResolvingMetadata } from 'next'
import type { Params } from '../layout'
import { pageMetadata } from '@/src/lib/seo'

type WithdrawalBlock =
	| { type: 'paragraph'; text: string; bold?: boolean }
	| { type: 'heading'; text: string }
	| { type: 'address'; ownerLabel?: boolean; contact?: boolean; email?: boolean; brandBold?: boolean }
	| { type: 'withdrawalLink'; text: string }
	| { type: 'form'; fields: string[] }

type WithdrawalSection = { title: string; blocks: WithdrawalBlock[] }

export async function generateMetadata({ params }: { params: Params }, parent: ResolvingMetadata): Promise<Metadata> {
	const { lng } = await params
	return pageMetadata(lng, 'widerruf', '/widerruf', parent)
}

async function page({ params }: { params: Params }) {
	const { lng } = await params
	const { t } = await getT('translations')
	const sections = t('withdrawal.sections', { returnObjects: true }) as WithdrawalSection[]

	return (
		<main id="main-content" tabIndex={-1} className="flex-1">
			<section className="w-full wrapper px-4 mt-24 lg:mt-36 pb-20 lg:pb-30">
				<div className="w-full max-w-[720px] [overflow-wrap:anywhere]">
					<Pill text={t('withdrawal.pill')} />
					<h1 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 ">
						{t('withdrawal.title')}
					</h1>
					<p className="text-black leading-6 mb-4"><strong>IWON Nail Display</strong></p>
					<p className="text-grayscale-500 leading-6 ">{t('withdrawal.updated')}</p>
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
									case 'address':
										return (
											<div key={index} className="flex flex-col">
												<p className="text-black leading-6 mt-4">
													{block.brandBold ? <strong>IWON Nail Display</strong> : 'IWON Nail Display'}<br />
													{block.ownerLabel && <>{t('withdrawal.contact.owner')}: </>}{company.owner}<br />
													{company.street}<br />
													{company.postalCode} {company.city}<br />
													{t('withdrawal.contact.country')}
												</p>
												{(block.contact || block.email) && (
													<p className="text-black leading-6 mt-4">
														{block.contact && (
															<><strong>{t('withdrawal.contact.phone')}:</strong>{' '}
																<a className="underline" href={company.phoneHref}>{company.phone}</a><br />
															</>
														)}
														{block.contact ? <strong>{t('withdrawal.contact.email')}:</strong> : <>{t('withdrawal.contact.email')}:</>}{' '}
														<a className="underline break-all" href={`mailto:${company.email}`}>{company.email}</a>
													</p>
												)}
											</div>
										)
									case 'withdrawalLink':
										return (
											<p key={index} className="text-grayscale-500 leading-6 mt-4">
												<Link className="underline" href={`/${lng}/widerruf/formular`}>{block.text}</Link>
											</p>
										)
									case 'form':
										return (
											<div key={index}>
												{block.fields.map(field => (
													<p key={field} className="text-grayscale-500 leading-6 mt-4">
														<strong>{field}</strong><br />
														________________________________
													</p>
												))}
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
