import { getT } from '@/app/i18n'

import LinkButton from '../ui/LinkButton'

async function FooterNav({ lng }: { lng: string }) {
	const { t } = await getT('translations')

	const products = [
		{ name: t('footer.products.nails'), href: '/nails' },
		{ name: t('footer.products.display'), href: '/display-bar' },
		{ name: t('footer.products.magnetic'), href: '/magnetic-nails' },
		{ name: t('footer.products.frame'), href: '/frame-display' },
		{ name: t('footer.products.cabinet'), href: '/cabinet-display' },
	]

	const company = [
		{ name: t('footer.company.system'), href: '/system' },
		{ name: t('footer.company.innovation'), href: '/innovation' },
		{ name: t('footer.company.possiblities'), href: '/possibilities' },
		{ name: t('footer.company.organisation'), href: '/organisation' },
	]
	const legal = [
		{ name: t('footer.legal.tos'), href: '/privacy-policy' },

		{ name: t('footer.legal.faq'), href: '/faq' },
	]

	return (
		<div className="w-full flex gap-6 mt-6 md:mt-12">
			<p className="hidden md:block text-grayscale-500 leading-6 max-w-[458px]">{t('footer.info')}</p>
			<div className="flex  gap-x-10 gap-y-6  flex-wrap w-full md:justify-end lg:gap-x-12">
				<ul className="flex flex-col gap-y-2 items-start">
					<li>
						<span className="leading-5 text-sm ">{t('footer.products.title')}</span>
					</li>
					{products.map(product => (
						<li key={product.name}>
							<LinkButton variant="footer" href={`${lng}/products/${product.href}`}>
								{product.name}
							</LinkButton>
						</li>
					))}
				</ul>
				<ul className="flex flex-col gap-y-2 items-start">
					<li>
						<span className="leading-5 text-sm ">{t('footer.company.title')}</span>
					</li>
					{company.map(item => (
						<li key={item.name}>
							<LinkButton variant="footer" href={`${lng}/${item.href}`}>
								{item.name}
							</LinkButton>
						</li>
					))}
				</ul>
				<ul className="flex flex-col gap-y-2 items-start w-full xs:w-fit">
					<li>
						<span className="leading-5 text-sm ">{t('footer.legal.title')}</span>
					</li>
					{legal.map(item => (
						<li key={item.name}>
							<LinkButton variant="footer" href={`${lng}/${item.href}`}>
								{item.name}
							</LinkButton>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

export default FooterNav
