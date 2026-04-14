import HomeHeader from '@/src/components/homepage/HomeHeader.'
import { getT } from '../i18n'
import { Params } from './layout'
import VideoSection from '@/src/components/homepage/VideoSection'
import ProductsSection from '@/src/components/homepage/ProductsSection'

export default async function Home({ params }: { params: Params }) {
	const { lng } = await params
	const { t } = await getT('translations')

	return (
		<main>
			<HomeHeader lng={lng} />
			<VideoSection />
			<ProductsSection lng={lng} />
		</main>
	)
}
