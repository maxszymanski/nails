export type ProductName = 'nails' | 'magnetic' | 'transparent' | 'frame' | 'cabinet' | 'display'

export type Product = {
	id: number
	name: ProductName
	slug: string
	price: number
	image: string
}

export const products: Product[] = [
	{ id: 0, name: 'nails', slug: `fingernagel`, price: 0.6, image: '/assets/nails.png' },

	{
		id: 1,
		name: 'magnetic',
		slug: `magnetnagel`,
		price: 0.6,
		image: '/assets/magnetic-nails.png',
	},

	{
		id: 2,
		name: 'transparent',
		slug: `transparente-nagel`,
		price: 0.6,
		image: '/assets/transparent-nails.png',
	},
	{
		id: 3,
		name: 'frame',
		slug: `rahmendisplay`,
		price: 0.6,
		image: '/assets/frame-nails.png',
	},
	{
		id: 4,
		name: 'cabinet',
		slug: `vitrinenauslage`,
		price: 0.6,
		image: '/assets/cabinet-nails.png',
	},
	{
		id: 5,
		name: 'display',
		slug: `nagelstreifen`,
		price: 0.6,
		image: '/assets/display-nails.png',
	},
]
