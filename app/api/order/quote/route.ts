import { CheckoutError, quoteSchema } from '@/src/lib/checkout'
import { getOrderQuote } from '@/src/lib/order-quote'

export async function POST(req: Request) {
	let body: unknown
	try {
		body = await req.json()
	} catch {
		return Response.json({ code: 'INVALID_CART' }, { status: 400 })
	}
	const parsed = quoteSchema.safeParse(body)
	if (!parsed.success) return Response.json({ code: 'INVALID_CART' }, { status: 400 })
	try {
		const quote = await getOrderQuote(parsed.data.cart, parsed.data.delivery)
		return Response.json({ quote }, { headers: { 'Cache-Control': 'no-store' } })
	} catch (error) {
		if (error instanceof CheckoutError) return Response.json({ code: error.code }, { status: error.status })
		return Response.json({ code: 'QUOTE_UNAVAILABLE' }, { status: 503 })
	}
}
