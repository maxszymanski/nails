import { z } from 'zod'

const attemptSchema = z.object({
	orderId: z.uuid(),
	createdAt: z.iso.datetime(),
})

export async function getOrderAttempt(payload: string) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
	const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
	const storageKey = `order-attempt:${fingerprint}`
	const saved = sessionStorage.getItem(storageKey)
	if (saved) {
		const attempt = attemptSchema.parse(JSON.parse(saved))
		return { ...attempt, storageKey }
	}

	const attempt = { orderId: crypto.randomUUID(), createdAt: new Date().toISOString() }
	// Persist before sending so a lost response or a remount reuses the same request.
	sessionStorage.setItem(storageKey, JSON.stringify(attempt))
	return { ...attempt, storageKey }
}
