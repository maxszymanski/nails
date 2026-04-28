import { getT } from '@/app/i18n'
import FaqAccordeon from './FaqAccordeon'

async function FaqSection() {
	const { t } = await getT('translations')

	const faqs = t('faqItems', { returnObjects: true }) as { title: string; answer: string }[]
	return (
		<div className="flex flex-col max-w-[752px] px-4 mx-auto w-full mt-16 pb-20 lg:pb-30">
			{faqs.map((faq, idx) => (
				<FaqAccordeon key={faq.title} title={faq.title} answer={faq.answer} idx={idx} />
			))}
		</div>
	)
}

export default FaqSection
