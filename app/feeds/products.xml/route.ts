import { productFeedXml } from '@/src/lib/product-feed'

export const dynamic = 'force-static'
export const revalidate = 3600

export function GET() {
	return new Response(productFeedXml(), {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Content-Language': 'de-DE',
			'X-Robots-Tag': 'noindex',
		},
	})
}
