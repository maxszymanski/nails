interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	isActive?: boolean
	isActiveClass?: string
	children: React.ReactNode

	variant?: 'primary' | 'rounded' | 'switch'

	restClass?: string
}

export const mainClass =
	'flex items-center justify-center transition-colors duration-300 cursor-pointer outline-none text-nowrap relative  focus-visible:ring-2  focus-visible:ring-offset-2 focus-visible:ring-offset-white'

const variants = {
	primary: 'bg-black-primary text-white',
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
