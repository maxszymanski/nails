import { customerRequestAttemptSchema, type CustomerRequest } from './customer-request'

type Submission = Omit<CustomerRequest, 'requestId' | 'createdAt' | 'lng'> & { lng: string }

export async function submitCustomerRequest(payload: Submission) {
	const serialized = JSON.stringify(payload)
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized))
	const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
	const storageKey = `customer-request:${fingerprint}`
	const saved = sessionStorage.getItem(storageKey)
	const attempt = saved
		? customerRequestAttemptSchema.parse(JSON.parse(saved))
		: { requestId: crypto.randomUUID(), createdAt: new Date().toISOString() }
	// Keep the same identity when retrying after a lost response or a remount.
	sessionStorage.setItem(storageKey, JSON.stringify(attempt))
	const response = await fetch('/api/customer-request', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...payload, ...attempt }),
	})
	const result = await response.json()
	if (!response.ok || result.ok !== true) {
		throw new Error(result.code === 'REQUEST_EXPIRED' ? 'REQUEST_EXPIRED' : 'REQUEST_FAILED')
	}
	try {
		sessionStorage.removeItem(storageKey)
	} catch {
		// A cleanup failure must not turn an accepted submission into a retry.
	}
}
