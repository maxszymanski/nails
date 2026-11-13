export type ProductName = 'nails' | 'magnetic' | 'transparent' | 'frame' | 'cabinet' | 'display'

export type Product = {
	id: number
	sku: string
	name: ProductName
	slug: string
	price: number
	inStock: boolean
	googleProductCategory: string
	weightGrams: number
	images: string[]
	patent?: string
}
export const PRODUCT_BRAND = 'Iwon Nail Display'

export type CompatibleProduct = {
	id: string
	name: string
	lng: string
	image: string
}

export const products: Product[] = [
	{
		id: 0,
		sku: 'ind-nails',
		name: 'nails',
		slug: `fingernagel`,
		price: 7.2,
		inStock: true,
		googleProductCategory: '499897',
		weightGrams: 30,
		images: [
			'/assets/nails/nail.png',
			'/assets/nails/nail-2.png',
			'/assets/nails/nail-3.png',
			'/assets/nails/nail-4.png',
		],
		patent: '10 2019 135 058',
	},
	{
		id: 1,
		sku: 'ind-magnetic',
		name: 'magnetic',
		slug: `magnetnagel`,
		price: 12,
		inStock: true,
		googleProductCategory: '499897',
		weightGrams: 35,
		images: [
			'/assets/magnetic/magnetic-nails.png',
			'/assets/magnetic/magnetic-nails-2.png',
			'/assets/magnetic/magnetic-nails-3.png',
			'/assets/magnetic/magnetic-nails-4.png',
		],
		patent: '10 2019 135 058',
	},
	{
		id: 2,
		sku: 'ind-transparent',
		name: 'transparent',
		slug: `transparente-nagel`,
		price: 7.2,
		inStock: true,
		googleProductCategory: '499897',
		weightGrams: 30,
		images: [
			'/assets/transparent/transparent-nails.png',
			'/assets/transparent/transparent-nails-2.png',
			'/assets/transparent/transparent-nails-3.png',
			'/assets/transparent/transparent-nails-4.png',
		],
		patent: '10 2019 135 058',
	},
	{
		id: 3,
		sku: 'ind-frame',
		name: 'frame',
		slug: `rahmendisplay`,
		price: 79.99,
		inStock: true,
		googleProductCategory: '4160',
		weightGrams: 890,
		images: [
			'/assets/frame/frame-nails.png',
			'/assets/frame/frame-nails-2.png',
			'/assets/frame/frame-nails-3.png',
			'/assets/frame/frame-nails-4.png',
		],
	},
	{
		id: 4,
		sku: 'ind-cabinet',
		name: 'cabinet',
		slug: `vitrinenauslage`,
		price: 99.99,
		inStock: true,
		googleProductCategory: '4160',
		weightGrams: 2181,
		images: [
			'/assets/cabinet/cabinet-nails.png',
			'/assets/cabinet/cabinet-nails-2.png',
			'/assets/cabinet/cabinet-nails-3.png',
			'/assets/cabinet/cabinet-nails-4.png',
		],
	},
	{
		id: 5,
		sku: 'ind-display',
		name: 'display',
		slug: `nagelstreifen`,
		price: 14.9,
		inStock: true,
		googleProductCategory: '499897',
		weightGrams: 109,
		images: [
			'/assets/display/display-nails.png',
			'/assets/display/display-nails-2.png',
			'/assets/display/display-nails-3.png',
			'/assets/display/display-nails-4.png',
		],
	},
]

export const compatibleProducts: CompatibleProduct[] = [
	{
		name: 'skadis',
		lng: 'skadis-one',
		id: '503.208.05',
		image: '/assets/skadis-one.png',
	},
	{
		name: 'skadis',
		lng: 'skadis-two',
		id: '003.207.99',
		image: '/assets/skadis-two.png',
	},
	{
		name: 'mosslanda',
		lng: 'mosslanda',
		id: '902.921.03',
		image: '/assets/mosslanda-one.png',
	},
	{
		name: 'mosslanda',
		lng: 'mosslanda',
		id: '402.917.66',
		image: '/assets/mosslanda-two.png',
	},
	{
		name: 'mosslanda',
		lng: 'mosslanda',
		id: '705.869.41',
		image: '/assets/mosslanda-three.png',
	},
	{
		name: 'mosslanda',
		lng: 'mosslanda',
		id: '805.898.35',
		image: '/assets/mosslanda-four.png',
	},
]
