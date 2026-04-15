import HomeHeader from '@/src/components/homepage/HomeHeader.'
import { getT } from '../i18n'
import { Params } from './layout'
import VideoSection from '@/src/components/homepage/VideoSection'
import ProductsSection from '@/src/components/homepage/ProductsSection'
import ChoiceSection from '@/src/components/homepage/ChoiceSection'
import OptionsSection from '@/src/components/homepage/OptionsSection'
import OrganizationSection from '@/src/components/homepage/OrganizationSection'

export default async function Home({ params }: { params: Params }) {
	const { lng } = await params
	const { t } = await getT('translations')

	return (
		<main>
			<HomeHeader lng={lng} />
			<VideoSection />
			<ProductsSection lng={lng} />
			<ChoiceSection lng={lng} />
			<OptionsSection lng={lng} />
			<OrganizationSection lng={lng} />
		</main>
	)
}
