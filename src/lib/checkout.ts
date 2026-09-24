import { z } from 'zod'
import { products } from '@/src/data/products'

// Standard rates: https://europa.eu/youreurope/business/finance-and-tax/vat/vat-rules-rates/index_en.htm
// Reviewed 2026-09-23. Special VAT territories require an individual quote.
export const VAT_RATES = {
	AT: 20, BE: 21, BG: 20, CY: 19, CZ: 21, DE: 19, DK: 25, EE: 24, GR: 24,
	ES: 21, FI: 25.5, FR: 20, HR: 25, HU: 27, IE: 23, IT: 22, LT: 21, LU: 17,
	LV: 21, MT: 18, NL: 21, PL: 23, PT: 23, RO: 21, SE: 25, SI: 22, SK: 23,
} as const

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
	if (!Object.hasOwn(VAT_RATES, country)) throw new CheckoutError('MANUAL_QUOTE')
	const validated = cartSchema.safeParse(cart)
	if (!validated.success) throw new CheckoutError('INVALID_CART', 400)
	let subtotalCents = 0
	for (const item of validated.data.items) {
		const product = products.find(product => product.id === item.id)
		if (!product) throw new CheckoutError('INVALID_CART', 400)
		subtotalCents += Math.round(product.price * 100) * item.quantity
	}
	if (!Number.isSafeInteger(subtotalCents) || subtotalCents <= 1) throw new CheckoutError('INVALID_CART', 400)
	const vatRate = vatExempt && country !== 'DE' ? 0 : VAT_RATES[country as keyof typeof VAT_RATES]
	const productVatCents = Math.round(subtotalCents * vatRate / 100)
	const productsGrossCents = subtotalCents + productVatCents
	const shippingCents = country === 'DE' ? (productsGrossCents >= 5000 ? 0 : 490) : 990
	// Delivery prices are final amounts: extract their VAT, do not add it again.
	const shippingVatCents = shippingCents - Math.round(shippingCents * 100 / (100 + vatRate))
	return {
		subtotalCents, productVatCents, shippingCents, shippingVatCents,
		vatCents: productVatCents + shippingVatCents,
		vatRate, totalCents: productsGrossCents + shippingCents,
	}
}
