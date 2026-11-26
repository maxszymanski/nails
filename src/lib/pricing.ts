export const GERMAN_VAT_RATE = 19

export function getDiscountedPrice(netPrice: number, discount = 0) {
	if (!Number.isFinite(discount) || discount < 0 || discount >= 100) {
		throw new RangeError('Discount must be between 0 and 100 (exclusive)')
	}
	const netCents = Math.round(netPrice * 100)
	return Math.round(netCents * (100 - discount) / 100) / 100
}

export function getGermanGrossPrice(netPrice: number) {
	const netCents = Math.round(netPrice * 100)
	return (netCents + Math.round(netCents * GERMAN_VAT_RATE / 100)) / 100
}
