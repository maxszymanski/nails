import Link from 'next/link'

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	href: string
	isActive?: boolean
	isActiveClass?: string
	children: React.ReactNode
	variant?: 'primary' | 'rounded' | 'switch' | 'secondary' | 'default' | 'footer'
	restClass?: string
}

const variants = {
	primary:
		'bg-my-purple text-white h-10 rounded-full px-4 text-sm leading-5 font-medium hover:bg-my-purple/90 focus-visible:ring-my-purple',
	rounded:
		'rounded-full size-10 shrink-0 border border-grayscale hover:bg-grayscale-100 relative focus-visible:ring-my-purple/50',
	switch: 'rounded-[50px] px-2.5 py-2.5 bg-grayscale-100 h-10 focus-visible:ring-my-purple/50',
	secondary:
		'bg-grayscale-100 text-grayscale-500 h-10 rounded-full px-4 text-sm leading-5 font-medium hover:bg-grayscale focus-visible:ring-my-purple',
	default: 'bg-transparent',
	footer: 'text-sm text-grayscale-500 hover:text-grayscale-500/70 leading-5 focus-visible:ring-my-purple/50 justify-start',
}

export const mainClass =
	'flex items-center justify-center transition-colors duration-300 cursor-pointer outline-none text-nowrap relative focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white'

function LinkButton({ variant = 'primary', children, restClass, href, ...rest }: LinkButtonProps) {
	const variantClass = variants[variant] || variants.primary

	return (
		<Link href={href} className={`${mainClass} ${restClass} ${variantClass}`} {...rest}>
			{children}
		</Link>
	)
}

export default LinkButton
