export type ProductName = 'nails' | 'magnetic' | 'transparent' | 'frame' | 'cabinet' | 'display'

export type Product = {
	id: number
	name: ProductName
	slug: string
	price: number
	images: string[]
	patent?: string
}

export const products: Product[] = [
	{
		id: 0,
		name: 'nails',
		slug: `fingernagel`,
		price: 0.6,
		images: [
			'/assets/nails/nail.png',
			'/assets/nails/nail-2.png',
			'/assets/nails/nail-3.png',
			'/assets/nails/nail-4.png',
		],
		patent: '10 2019 135 058.',
	},
	{
		id: 1,
		name: 'magnetic',
		slug: `magnetnagel`,
		price: 0.6,
		images: [
			'/assets/magnetic/magnetic-nails.png',
			'/assets/magnetic/magnetic-nails-2.png',
			'/assets/magnetic/magnetic-nails-3.png',
			'/assets/magnetic/magnetic-nails-4.png',
		],
		patent: '10 2019 135 058.',
	},
	{
		id: 2,
		name: 'transparent',
		slug: `transparente-nagel`,
		price: 0.6,
		images: [
			'/assets/transparent/transparent-nails.png',
			'/assets/transparent/transparent-nails-2.png',
			'/assets/transparent/transparent-nails-3.png',
			'/assets/transparent/transparent-nails-4.png',
		],
		patent: 'This product is protected by German Patent No. 10 2019 135 058.',
	},
	{
		id: 3,
		name: 'frame',
		slug: `rahmendisplay`,
		price: 0.6,
		images: [
			'/assets/frame/frame-nails.png',
			'/assets/frame/frame-nails-2.png',
			'/assets/frame/frame-nails-3.png',
			'/assets/frame/frame-nails-4.png',
		],
	},
	{
		id: 4,
		name: 'cabinet',
		slug: `vitrinenauslage`,
		price: 0.6,
		images: [
			'/assets/cabinet/cabinet-nails.png',
			'/assets/cabinet/cabinet-nails-2.png',
			'/assets/cabinet/cabinet-nails-3.png',
			'/assets/cabinet/cabinet-nails-4.png',
		],
	},
	{
		id: 5,
		name: 'display',
		slug: `nagelstreifen`,
		price: 0.6,
		images: [
			'/assets/display/display-nails.png',
			'/assets/display/display-nails-2.png',
			'/assets/display/display-nails-3.png',
			'/assets/display/display-nails-4.png',
		],
	},
]
