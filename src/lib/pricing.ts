export const GERMAN_VAT_RATE = 19

export function getGermanGrossPrice(netPrice: number) {
	const netCents = Math.round(netPrice * 100)
	return (netCents + Math.round(netCents * GERMAN_VAT_RATE / 100)) / 100
}
