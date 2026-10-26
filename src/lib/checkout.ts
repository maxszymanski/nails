import { z } from 'zod'
import { products } from '@/src/data/products'

// EU standard rates: https://europa.eu/youreurope/business/finance-and-tax/vat/vat-rules-rates/index_en.htm
// Supported exports use 0% German VAT; local import taxes remain the customer's responsibility.
// Monaco is treated as France for VAT: https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/how-does-vat-work/territorial-scope_en
// Reviewed 2026-10-26. Unlisted destinations and special VAT territories require an individual quote.
export const VAT_RATES = {
	AT: 20, BE: 21, BG: 20, CY: 19, CZ: 21, DE: 19, DK: 25, EE: 24, GR: 24,
	ES: 21, FI: 25.5, FR: 20, HR: 25, HU: 27, IE: 23, IT: 22, LT: 21, LU: 17,
	LV: 21, MT: 18, NL: 21, PL: 23, PT: 23, RO: 21, SE: 25, SI: 22, SK: 23,
	CH: 0, AL: 0, AD: 0, BA: 0, ME: 0, IS: 0, XK: 0, LI: 0,
	MK: 0, MD: 0, MC: 20, NO: 0, SM: 0, RS: 0, TR: 0, UA: 0, VA: 0, AE: 0, QA: 0,
} as const

export const EXPORT_COUNTRIES = Object.keys(VAT_RATES).filter(country => VAT_RATES[country as keyof typeof VAT_RATES] === 0)

const REST_OF_EUROPE = ['AL', 'AD', 'BA', 'ME', 'IS', 'XK', 'LI', 'MK', 'MD', 'MC', 'NO', 'SM', 'RS', 'TR', 'UA', 'VA']
const SHIPPING_WEIGHT_LIMITS = [2000, 5000, 10000, 20000]
const SHIPPING_RATES = {
	eu: [1199, 2049, 2549, 3149],
	switzerland: [1699, 2999, 3799, 5199],
	restOfEurope: [1999, 3299, 4099, 5599],
	uaeQatar: [2299, 4899, 6499, 10399],
}

export function isExportCountry(country: string) {
	return EXPORT_COUNTRIES.includes(country)
}

export const deliverySchema = z.object({
	country: z.string().regex(/^(?:[A-Z]{2}|OTHER)$/),
	isBusiness: z.boolean(),
	vatId: z.string().trim().max(30).transform(value => value.replace(/[\s.-]/g, '').toUpperCase()),
})

export const cartSchema = z.strictObject({
	items: z.array(z.strictObject({
		id: z.number().int().nonnegative(),
		quantity: z.number().int().positive().max(10000),
	})).min(1).max(products.length)
		.refine(items => new Set(items.map(item => item.id)).size === items.length),
})

export const quoteSchema = z.strictObject({
	delivery: deliverySchema.strict(),
	cart: cartSchema,
})

export type Delivery = z.infer<typeof deliverySchema>
export type Cart = z.infer<typeof cartSchema>
export type Quote = {
	totalWeightGrams: number
	subtotalCents: number
	productVatCents: number
	shippingCents: number
	shippingVatCents: number
	vatCents: number
	vatRate: number
	totalCents: number
}

export class CheckoutError extends Error {
	constructor(public code: string, public status = 422) {
		super(code)
	}
}

export function calculateQuote(cart: Cart, country: string, vatExempt = false): Quote {
	if (country === 'GB') throw new CheckoutError('UK_MANUAL_QUOTE')
	if (!Object.hasOwn(VAT_RATES, country)) throw new CheckoutError('MANUAL_QUOTE')
	const validated = cartSchema.safeParse(cart)
	if (!validated.success) throw new CheckoutError('INVALID_CART', 400)
	let subtotalCents = 0
	let totalWeightGrams = 0
	for (const item of validated.data.items) {
		const product = products.find(product => product.id === item.id)
		if (!product) throw new CheckoutError('INVALID_CART', 400)
		subtotalCents += Math.round(product.price * 100) * item.quantity
		totalWeightGrams += product.weightGrams * item.quantity
	}
	if (!Number.isSafeInteger(subtotalCents) || subtotalCents <= 1) throw new CheckoutError('INVALID_CART', 400)
	const weightBand = SHIPPING_WEIGHT_LIMITS.findIndex(limit => totalWeightGrams <= limit)
	if (weightBand === -1) throw new CheckoutError('WEIGHT_LIMIT')
	const vatRate = vatExempt && country !== 'DE' ? 0 : VAT_RATES[country as keyof typeof VAT_RATES]
	const productVatCents = Math.round(subtotalCents * vatRate / 100)
	const productsGrossCents = subtotalCents + productVatCents
	const shippingZone = country === 'CH' ? 'switzerland'
		: country === 'AE' || country === 'QA' ? 'uaeQatar'
		: REST_OF_EUROPE.includes(country) ? 'restOfEurope' : 'eu'
	const shippingCents = country === 'DE'
		? (productsGrossCents >= 5000 ? 0 : 490)
		: SHIPPING_RATES[shippingZone][weightBand]
	// Delivery prices are final amounts: extract their VAT, do not add it again.
	const shippingVatCents = shippingCents - Math.round(shippingCents * 100 / (100 + vatRate))
	return {
		totalWeightGrams,
		subtotalCents, productVatCents, shippingCents, shippingVatCents,
		vatCents: productVatCents + shippingVatCents,
		vatRate, totalCents: productsGrossCents + shippingCents,
	}
}
