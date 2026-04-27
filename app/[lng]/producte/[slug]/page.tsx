import { products } from '@/src/data/products'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
	const { slug } = await params

	const product = products.find(c => c.slug === slug)

	if (!product) {
		return {}
	}

	return {
		title: `${product.name}`,
	}
}

export const revalidate = 86400

export async function generateStaticParams() {
	return products.map(product => ({
		product: product.slug,
	}))
}

async function page({ params }: { params: Params }) {
	const { slug } = await params

	const product = products.find(c => c.slug === slug)

	if (!product) {
		notFound()
	}

	return <main className="mt-33 flex-1">{product.slug}</main>
}

export default page
