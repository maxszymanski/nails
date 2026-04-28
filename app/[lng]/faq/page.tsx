import { getT } from '@/app/i18n'
import FaqSection from '@/src/components/ui/FaqSection'
import Pill from '@/src/components/ui/Pill'

export async function generateMetadata() {
	const { t } = await getT('translations')

	return {
		title: t(`nav.faq`),
		description: t(`nav.faq`),
		// openGraph: {
		// 	title: t(`products.pill`),
		// 	description: t(`products.pill`),
		// 	images: [
		// 		{
		// 			url: product.image,
		// 			width: 1200,
		// 			height: 630,
		// 			alt: t(`products.pill`),
		// 		},
		// 	],
		// },
		// twitter: {
		// 	card: 'summary_large_image',
		// 	title: t(`products.pill`),
		// 	description: t(`products.pill`),
		// 	images: [product.image],
		// },
	}
}

async function page() {
	const { t } = await getT('translations')

	return (
		<main className="flex-1">
			<section className="mt-24 lg:mt-36">
				<div className="w-full max-w-[1200px] mx-auto flex flex-col gap-12 lg:gap-20 px-4">
					<div className="flex flex-col w-full items-center">
						<div
							className=" flex flex-col items-center text-center mb-6  max-w-[580px] -tracking-[1%]"
							data-aos="fade-in">
							<Pill text={t('faq.pill')} />
							<h1 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 ">
								{t('faq.title')}
							</h1>
							<p className="text-grayscale-500 leading-6 w-full max-w-[450px] mx-auto ">
								{t('faq.subtitle')}
							</p>
						</div>
					</div>
				</div>
				<FaqSection />
			</section>
		</main>
	)
}

export default page
