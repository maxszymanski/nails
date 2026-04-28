import { getT } from '@/app/i18n'

import Pill from '@/src/components/ui/Pill'

export async function generateMetadata() {
	const { t } = await getT('translations')

	return {
		title: t(`nav.legal`),
		description: t(`privacy.general`),
	}
}

async function page() {
	const { t } = await getT('translations')
	return (
		<main className="flex-1">
			<section className="w-full wrapper px-4 mt-24 lg:mt-36 pb-20 lg:pb-30">
				<div className="w-full max-w-[720px]">
					<Pill text={t('privacy.pill')} />
					<h1 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 ">
						{t('privacy.title')}
					</h1>
					<p className="text-grayscale-500 leading-6 ">{t('privacy.subtitle')}</p>
					<div className="w-full pt-10">
						<h2 className="text-[32px] leading-10">1. {t('privacy.general')}</h2>
						<p className="text-grayscale-500 leading-6 mt-4">{t('privacy.generalOne')}</p>
						<div className="flex flex-col">
							<p className="text-black leading-6 mt-4">
								Ms Iwona Krol-Ptaszynska <br />
								Grillparzerstr. 12 <br />
								40699 Erkrath <br /> Germany <br />
								{t('privacy.phone')}: +49 (0) 177 3500405 <br />
								E-Mail: info@iwonnaildisplay.de
							</p>
						</div>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">2. {t('privacy.data')}</h2>
						<h3 className="text-xl leading-8 pt-10">1. {t('privacy.dataOne')}</h3>
						<p className="text-grayscale-500 leading-6 mt-4">{t('privacy.dataOneSub')}</p>
					</div>
					<div>
						<h3 className="text-xl leading-8 pt-10">2. {t('privacy.dataTwo')}</h3>
						<p className="text-grayscale-500 leading-6 mt-4">{t('privacy.dataTwoSub')}</p>
						<ul className="list-inside list-disc leading-6 text-grayscale-500">
							{(t('privacy.dataTwoList', { returnObjects: true }) as string[]).map((item, i) => (
								<li key={i}>{item}</li>
							))}
						</ul>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">3. {t('privacy.legal')}</h2>

						<p className="text-grayscale-500 leading-6 mt-4">{t('privacy.legalSub')}</p>
						<ul className="list-inside list-disc leading-6 text-grayscale-500">
							{(t('privacy.legalSubList', { returnObjects: true }) as string[]).map((item, i) => (
								<li key={i}>{item}</li>
							))}
						</ul>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">4. {t('privacy.dataSharing')}</h2>

						<p className="text-grayscale-500 leading-6 mt-4">{t('privacy.dataSharingSub')}</p>
						<ul className="list-inside list-disc leading-6 text-grayscale-500">
							{(t('privacy.dataSharingSubList', { returnObjects: true }) as string[]).map((item, i) => (
								<li key={i}>{item}</li>
							))}
						</ul>
						<p className="text-grayscale-500 leading-6 ">{t('privacy.dataSharingUnderlist')}</p>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">5. {t('privacy.cookies')}</h2>

						<p className="text-grayscale-500 leading-6 mt-4">{t('privacy.cookiesUnder')}</p>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">6. {t('privacy.retention')}</h2>

						<p className="text-grayscale-500 leading-6 mt-4">{t('privacy.retentionSub')}</p>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">7. {t('privacy.rights')}</h2>

						<p className="text-grayscale-500 leading-6 mt-4">{t('privacy.rightsSub')}:</p>
						<ul className="list-inside list-disc leading-6 text-grayscale-500">
							{(t('privacy.rightsList', { returnObjects: true }) as string[]).map((item, i) => (
								<li key={i}>{item}</li>
							))}
						</ul>
						<p className="text-grayscale-500 leading-6 ">{t('privacy.dataSharingUnderlist')}</p>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">8. {t('privacy.security')}</h2>

						<p className="text-grayscale-500 leading-6 mt-4">{t('privacy.securitySub')}:</p>
					</div>
					<div className="pt-10">
						<h2 className="text-[32px] leading-10">{t('privacy.disclaimer')}</h2>

						<p className="text-grayscale-500 leading-6 mt-4">{t('privacy.disclaimerSub')}:</p>
					</div>
				</div>
			</section>
		</main>
	)
}

export default page
