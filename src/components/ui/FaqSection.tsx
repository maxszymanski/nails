import FaqAccordeon from './FaqAccordeon'

const faqs = [
	{
		title: 'How often can I reuse/redesign the nails?',
		answer: 'The nails can be redesigned multiple times. However, this is not recommended. You can order replacements from us at any time. Contact us!',
	},
	{
		title: 'How often can I reuse/redesign the nails? asdasdasd',
		answer: 'The nails can be redesigned multiple times. However, this is not recommended. You can order replacements from us at any time. Contact us!',
	},
	{
		title: 'How often can I reuse/redesign the nails? sdf',
		answer: 'The nails can be redesigned multiple times. However, this is not recommended. You can order replacements from us at any time. Contact us!',
	},
	{
		title: 'How often can I reuse/redesign the nails? asdasd',
		answer: 'The nails can be redesigned multiple times. However, this is not recommended. You can order replacements from us at any time. Contact us!',
	},
]

function FaqSection() {
	return (
		<div className="flex flex-col max-w-[752px] px-4 mx-auto w-full mt-16 pb-20 lg:pb-30">
			{faqs.map((faq, idx) => (
				<FaqAccordeon key={faq.title} title={faq.title} answer={faq.answer} idx={idx} />
			))}
		</div>
	)
}

export default FaqSection
