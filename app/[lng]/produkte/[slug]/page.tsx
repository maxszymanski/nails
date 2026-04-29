import { getT } from '@/app/i18n'
import AddToCard from '@/src/components/products/AddToCard'
import MobileCarousel from '@/src/components/products/MobileCarousel'
import FaqAccordeon from '@/src/components/ui/FaqAccordeon'
import MoreCard from '@/src/components/ui/MoreCard'
import { products } from '@/src/data/products'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Params = Promise<{ slug: string; lng: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
	const { slug } = await params

	const product = products.find(c => c.slug === slug)

	if (!product) {
		return {}
	}

	const { t } = await getT('translations')

	return {
		title: t(`products.products.${product.name}`),
		description: t(`products.products.${product.name}`),
		// openGraph: {
		// 	title: t(`products.products.${product.name}`),
		// 	description: t(`products.products.${product.name}`),
		// 	images: [
		// 		{
		// 			url: product.images[0],
		// 			width: 1200,
		// 			height: 630,
		// 			alt: t(`products.products.${product.name}`),
		// 		},
		// 	],
		// },
		// twitter: {
		// 	card: 'summary_large_image',
		// 	title: t(`products.products.${product.name}`),
		// 	description: t(`products.products.${product.name}`),
		// 	images: [product.images[0]],
		// },
	}
}

export const revalidate = 86400

export async function generateStaticParams() {
	return products.map(product => ({
		product: product.slug,
	}))
}

async function page({ params }: { params: Params }) {
	const { slug, lng } = await params
	const { t } = await getT('translations')
	const product = products.find(c => c.slug === slug)

	if (!product) {
		notFound()
	}

	const features = t(`products.features.${product.name}`, { returnObjects: true }) as string[]
	const includes = t(`products.includes.${product.name}`, { returnObjects: true }) as string[]
	const dimensions = t(`products.dimensions.${product.name}`, { returnObjects: true }) as string[]

	const restProducts = products.filter(p => p.id !== product.id).slice(0, 4)

	return (
		<main className=" flex-1">
			<section className="mt-24 lg:mt-36">
				<div className="w-full px-4 wrapper">
					<div className="flex flex-col gap-6 lg:flex-row  pb-25 lg:pb-30">
						<div className="flex flex-col lg:mb-4 w-full lg:max-w-[542px]">
							<div className="flex " data-aos="fade-in">
								<Link
									href={`/${lng}/produkte`}
									className="block text-sm text-grayscale-500 leading-5 hover:text-black-primary/80 duration-300 transition-colors px-2 py-2.5 font-medium">
									{t('nav.products')}
								</Link>
								<Link
									href={`/${lng}/produkte`}
									className="block text-sm text-black-primary leading-5 hover:text-black-primary/80 duration-300 transition-colors px-2 py-2.5 font-medium">
									{t(`products.products.${product.name}`)}
								</Link>
							</div>

							<MobileCarousel images={product.images} />
						</div>
						<div className="max-w-[542px] lg:mt-10 w-full mx-auto lg:mx-0" data-aos="fade-up">
							<h1 className="text-[32px] leading-10 lg:text-5xl lg:leading-14">
								{t(`products.products.${product.name}`)}
							</h1>
							{product.patent && (
								<p className="text-sm leading-5 text-grayscale-500 opacity-50 mb-4">
									{t(`products.patent`)} <span className="inline-block">{product.patent}</span>
								</p>
							)}

							<p className="text-sm leading-5 text-grayscale-500 mb-6">
								{t(`products.description.${product.name}`)}
							</p>
							<p className="text-[32px] leading-10 lg:text-5xl lg:leading-14 mb-4">
								{product.price.toFixed(2).replace('.', ',')}€
							</p>
							<AddToCard product={product} />
							<div className="flex flex-col">
								<FaqAccordeon title={t('products.features.title')} list={features} />
								<FaqAccordeon idx={1} title={t('products.includes.title')} list={includes} />
								<FaqAccordeon idx={2} title={t('products.dimensions.title')} list={dimensions} />
							</div>
						</div>
					</div>
				</div>
			</section>
			<section className="w-full px-4 wrapper pb-25 lg:pb-30">
				<h2
					className="text-[32px] leading-10 lg:text-5xl lg:leading-14 text-center mb-12 lg:mb-14"
					data-aos="fade-in">
					{t('products.mayLike')}
				</h2>
				<div className="grid grid-cols-2 gap-2 xs:gap-4 md:grid-cols-4">
					{restProducts.map(product => (
						<MoreCard key={product.id} product={product} lng={lng} />
					))}
				</div>
			</section>
		</main>
	)
}

export default page
