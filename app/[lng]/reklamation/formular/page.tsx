import { getT } from '@/app/i18n'
import type { Metadata, ResolvingMetadata } from 'next'
import type { Params } from '../../layout'
import Pill from '@/src/components/ui/Pill'
import ComplaintForm from '@/src/components/ui/ComplaintForm'
import { pageMetadata } from '@/src/lib/seo'

export async function generateMetadata({ params }: { params: Params }, parent: ResolvingMetadata): Promise<Metadata> {
	const { lng } = await params
	return {
		...(await pageMetadata(lng, 'complaintForm', '/reklamation/formular', parent)),
		robots: { index: false, follow: true },
	}
}

async function page({ params }: { params: Params }) {
	const { lng } = await params
	const { t } = await getT('translations')
	return (
		<main id="main-content" tabIndex={-1} className="flex-1">
			<section className="w-full wrapper px-4 mt-24 lg:mt-36 pb-20 lg:pb-30">
				<div className="w-full max-w-[720px] mx-auto [overflow-wrap:anywhere]">
					<Pill text={t('complaintForm.pill')} />
					<h1 className="leading-12 text-[40px] md:text-5xl md:leading-14 mt-2 mb-10">{t('complaintForm.title')}</h1>
					<ComplaintForm lng={lng} />
				</div>
			</section>
		</main>
	)
}

export default page
