import { Resend } from 'resend'
import { z } from 'zod'
import { customerRequestSchema } from '@/src/lib/customer-request'
import { customerRequestEmails } from '@/src/lib/customer-request-email'

export async function POST(req: Request) {
	let body: unknown
	try {
		body = await req.json()
	} catch {
		return Response.json({ error: 'Invalid request data' }, { status: 400 })
	}
	const parsed = customerRequestSchema.safeParse(body)
	if (!parsed.success) return Response.json({ error: 'Invalid request data' }, { status: 400 })
	const request = parsed.data
	// Resend retains idempotency keys for 24 hours, matching the order flow.
	const age = Date.now() - Date.parse(request.createdAt)
	if (age >= 23 * 60 * 60 * 1000 || age < -5 * 60 * 1000) {
		return Response.json({ code: 'REQUEST_EXPIRED' }, { status: 409 })
	}
	const apiKey = process.env.RESEND_API_KEY?.trim()
	const from = (request.kind === 'withdrawal' ? process.env.WITHDRAWAL_FROM_EMAIL : process.env.COMPLAINT_FROM_EMAIL)?.trim()
	const owner = (request.kind === 'withdrawal' ? process.env.WITHDRAWAL_OWNER_EMAIL : process.env.COMPLAINT_OWNER_EMAIL)?.trim()
	if (!apiKey || !from || !owner || !z.email().safeParse(owner).success) {
		return Response.json({ error: 'Missing email configuration' }, { status: 503 })
	}
	try {
		const resend = new Resend(apiKey)
		const { data, error } = await resend.batch.send(customerRequestEmails(request, from, owner), {
			idempotencyKey: `${request.kind}/${request.requestId}`,
			batchValidation: 'strict',
		})
		if (error || data?.data.length !== 2) {
			return Response.json({ error: 'Email delivery failed' }, { status: 502 })
		}
	} catch {
		return Response.json({ error: 'Email delivery failed' }, { status: 502 })
	}
	return Response.json({ ok: true })
}
