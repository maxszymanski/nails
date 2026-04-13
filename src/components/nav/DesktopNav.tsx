'use client'

import { useT } from '@/app/i18n/client'
import LogoLink from '../ui/LogoLink'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function DesktopNav({ lng }: { lng: string }) {
	const { t } = useT('translations')
	const pathname = usePathname()

	console.log(pathname)

	const navList = [
		{ href: `/${lng}`, linkName: `${t('nav.home')}` },
		{
			href: `/${lng}/products`,
			linkName: `${t('nav.products')}`,
		},
		{
			href: `/${lng}/legal`,
			linkName: `${t('nav.legal')}`,
		},
		{ href: `/${lng}/faq`, linkName: `${t('nav.faq')}` },
	]

	return (
		<div className=" hidden w-full lg:flex items-center py-6  justify-between wrapper lg:px-4">
			<div className="flex items-center gap-12">
				<LogoLink />
				<ul className="flex items-center gap-[15px]">
					{navList.map(link => (
						<NavLink
							key={link.linkName}
							name={link.linkName}
							href={link.href}
							isActive={link.href === `/${lng}` ? pathname === `/${lng}` : pathname.startsWith(link.href)}
						/>
					))}
				</ul>
			</div>
		</div>
	)
}

const NavLink = ({ href, name, isActive = false }: { href: string; name: string; isActive?: boolean }) => {
	return (
		<li>
			<Link
				href={href}
				className={`text-sm block leading-5 font-medium bg-transparent duration-300 transition-colors hover:bg-grayscale-100 px-4 py-2.5 rounded-[500px] ${isActive ? 'text-black-primary' : 'text-grayscale-500'}`}>
				{name}
			</Link>
		</li>
	)
}

export default DesktopNav
