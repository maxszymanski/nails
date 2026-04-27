interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	isActive?: boolean
	isActiveClass?: string
	children: React.ReactNode

	variant?: 'primary' | 'rounded' | 'switch'

	restClass?: string
}

const mainClass =
	'flex items-center justify-center transition-colors duration-300 cursor-pointer outline-none text-nowrap relative focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white'

const variants = {
	primary:
		'bg-my-purple text-white h-10 rounded-full px-4 text-sm leading-5 font-medium hover:bg-my-purple/90 focus-visible:ring-my-purple',
	rounded: 'rounded-full size-10 shrink-0 border border-grayscale  relative hover:bg-grayscale-100',
	switch: 'rounded-[50px] px-2.5 py-2.5 h-10',
}

function Button({
	variant = 'primary',
	children,
	restClass,

	...rest
}: ButtonProps) {
	const variantClass = variants[variant] || variants.primary

	return (
		<button className={`${mainClass} ${restClass} ${variantClass} `} {...rest}>
			{children}
		</button>
	)
}

export default Button
