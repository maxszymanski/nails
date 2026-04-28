import { getT } from '@/app/i18n'
import Pill from '@/src/components/ui/Pill'
import { Params } from '../layout'
import ProductCard from '@/src/components/ui/ProductCard'
import { products } from '@/src/data/products'

export async function generateMetadata() {
	const { t } = await getT('translations')

	return {
		title: t(`nav.products`),
		description: t(`nav.products`),
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

async function page({ params }: { params: Params }) {
	const { lng } = await params

	const { t } = await getT('translations')

	return (
		<main className="flex-1 ">
			<section className="mt-24 lg:mt-36">
				<div className="w-full max-w-[1200px] mx-auto flex flex-col gap-12 lg:gap-20 px-4">
					<div className="flex flex-col w-full items-center">
						<div
							className=" flex flex-col items-center text-center mb-6  max-w-[670px] -tracking-[1%]"
							data-aos="fade-in">
							<Pill text={t('products.pill')} />
							<h1 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 ">
								{t('products.title')}
							</h1>
							<p className="text-grayscale-500 leading-6 w-full max-w-[470px] mx-auto ">
								{t('products.subtitle')}
							</p>
						</div>
					</div>
				</div>
			</section>
			<section className="w-full pt-14 pb-20 lg:pb-30">
				<div className="px-4 wrapper flex flex-col gap-y-12 gap-x-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 ">
					{products.map(product => (
						<ProductCard key={product.id} item={product} lng={lng} />
					))}
				</div>
			</section>
		</main>
	)
}

export default page
