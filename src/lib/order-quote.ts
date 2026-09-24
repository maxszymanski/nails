import { calculateQuote, CheckoutError, type Cart, type Delivery } from '@/src/lib/checkout'

export async function getOrderQuote(cart: Cart, delivery: Delivery) {
	const standardQuote = calculateQuote(cart, delivery.country)
	if (!delivery.isBusiness || !delivery.vatId || delivery.country === 'DE') return standardQuote
	const countryCode = delivery.country === 'GR' ? 'EL' : delivery.country
	if (!delivery.vatId.startsWith(countryCode) || !/^[A-Z]{2}[A-Z0-9]{2,12}$/.test(delivery.vatId)) {
		throw new CheckoutError('VAT_INVALID')
	}
	let result
	try {
		const response = await fetch('https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ countryCode, vatNumber: delivery.vatId.slice(2) }),
			cache: 'no-store',
			signal: AbortSignal.timeout(10000),
		})
		if (!response.ok) throw new Error('VIES unavailable')
		result = await response.json()
	} catch {
		throw new CheckoutError('VAT_UNAVAILABLE', 503)
	}
	if (result?.userError && result.userError !== 'VALID' && result.userError !== 'INVALID') {
		throw new CheckoutError('VAT_UNAVAILABLE', 503)
	}
	if (typeof result?.valid !== 'boolean' || result.countryCode !== countryCode || result.vatNumber !== delivery.vatId.slice(2)) {
		throw new CheckoutError('VAT_UNAVAILABLE', 503)
	}
	if (!result.valid) throw new CheckoutError('VAT_INVALID')
	return calculateQuote(cart, delivery.country, true)
}
