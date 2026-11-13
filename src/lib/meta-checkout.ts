import { products } from '@/src/data/products'
import { cartSchema, MAX_SHIPPING_WEIGHT_GRAMS } from '@/src/lib/checkout'
import type { CartItem } from '@/src/components/stores/CartStore'

export type MetaCheckoutParams = Record<string, string | string[] | undefined>
export type MetaCheckoutError = 'MISSING_PRODUCTS' | 'INVALID_PRODUCTS' | 'UNKNOWN_PRODUCT' | 'INVALID_QUANTITY'
	| 'DUPLICATE_PRODUCT' | 'UNAVAILABLE_PRODUCT' | 'WEIGHT_LIMIT' | 'COUPON_UNSUPPORTED'
export type MetaCheckoutResult = { ok: true; items: CartItem[] } | { ok: false; code: MetaCheckoutError }

export function parseMetaCheckout(params: MetaCheckoutParams): MetaCheckoutResult {
	// Next.js searchParams are already URL-decoded. Do not decode a second time.
	const value = params.products
	if (value === undefined || value === '') return { ok: false, code: 'MISSING_PRODUCTS' }
	if (typeof value !== 'string' || value.length > 2048 || (params.coupon !== undefined && typeof params.coupon !== 'string')) {
		return { ok: false, code: 'INVALID_PRODUCTS' }
	}
	const entries = value.split(',')
	if (entries.length > products.length) return { ok: false, code: 'INVALID_PRODUCTS' }
	const items: CartItem[] = []
	let weight = 0
	for (const entry of entries) {
		const parts = entry.split(':')
		if (parts.length !== 2 || !parts[0]) return { ok: false, code: 'INVALID_PRODUCTS' }
		const product = products.find(product => product.sku === parts[0])
		if (!product) return { ok: false, code: 'UNKNOWN_PRODUCT' }
		if (!product.inStock) return { ok: false, code: 'UNAVAILABLE_PRODUCT' }
		const quantity = Number(parts[1])
		if (!Number.isSafeInteger(quantity) || quantity <= 0 || String(quantity) !== parts[1]) {
			return { ok: false, code: 'INVALID_QUANTITY' }
		}
		if (items.some(item => item.id === product.id)) return { ok: false, code: 'DUPLICATE_PRODUCT' }
		items.push({ id: product.id, name: product.name, slug: product.slug, price: product.price, image: product.images[0], quantity })
		weight += product.weightGrams * quantity
	}
	if (!cartSchema.safeParse({ items: items.map(({ id, quantity }) => ({ id, quantity })) }).success) {
		return { ok: false, code: 'INVALID_QUANTITY' }
	}
	if (weight > MAX_SHIPPING_WEIGHT_GRAMS) return { ok: false, code: 'WEIGHT_LIMIT' }
	if (params.coupon?.trim()) return { ok: false, code: 'COUPON_UNSUPPORTED' }
	return { ok: true, items }
}
