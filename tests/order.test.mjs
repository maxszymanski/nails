import assert from 'node:assert/strict'
import { randomUUID, webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const environment = {
	RESEND_API_KEY: 're_test_only',
	ORDER_FROM_EMAIL: 'Shop <shop@example.invalid>',
	ORDER_OWNER_EMAIL: 'owner@example.invalid',
	PAYMENT_RECIPIENT: 'Test shop',
	PAYMENT_IBAN: 'TEST_IBAN',
	PAYMENT_BIC: 'TEST_BIC',
	PAYPAL_EMAIL: 'paypal@example.invalid',
}

// Load the actual TypeScript with an isolated environment and no real email SDK.
function loadModule(relativePath, overrides = {}, env = environment, globals = {}) {
	const filename = path.join(root, relativePath)
	if (filename.endsWith('.json')) return JSON.parse(readFileSync(filename, 'utf8'))
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
	}).outputText
	const exports = {}
	const localRequire = name => {
		if (name in overrides) return overrides[name]
		if (name.startsWith('@/')) return loadModule(name.slice(2) + (path.extname(name) ? '' : '.ts'), overrides, env, globals)
		if (name === 'zod') return require(name)
		throw new Error(`Unexpected test dependency: ${name}`)
	}
	const execute = vm.runInNewContext(`(function(require, exports, process) { ${compiled}\n })`, {
		Request, Response, TextEncoder, crypto: webcrypto, ...globals,
	}, { filename })
	execute(localRequire, exports, { env })
	return exports
}

function order() {
	return {
		orderId: randomUUID(),
		createdAt: new Date().toISOString(),
		lng: 'en',
		customer: {
			firstName: 'Test', lastName: 'Buyer', address: 'Test 1', zipCode: '12345', city: 'Test',
			email: 'buyer@example.invalid', terms: true,
		},
		cart: { items: [{ id: 4, quantity: 1 }] },
	}
}

function harness({ env = environment, mode } = {}) {
	const calls = []
	const deliveries = new Map()
	let firstCall = true
	class Resend {
		batch = {
			send: async (emails, options) => {
				calls.push({ emails, options })
				assert.equal(options.batchValidation, 'strict')
				const serialized = JSON.stringify(emails)
				const previous = deliveries.get(options.idempotencyKey)
				if (previous && previous !== serialized) return { error: { name: 'invalid_idempotent_request' } }
				if (mode === 'reject') return { error: { name: 'validation_error' } }
				if (mode === 'incomplete') return { data: { data: [{ id: 'one' }] }, error: null }
				deliveries.set(options.idempotencyKey, serialized)
				if (mode === 'lost-response' && firstCall) {
					firstCall = false
					throw new Error('Connection lost after acceptance')
				}
				return { data: { data: emails.map((_, i) => ({ id: String(i) })) }, error: null }
			},
		}
	}
	const route = loadModule('app/api/order/route.ts', { resend: { Resend } }, env)
	return {
		calls, deliveries,
		post: async body => route.POST(new Request('http://localhost/api/order', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: typeof body === 'string' ? body : JSON.stringify(body),
		})),
	}
}

const invalidCases = {
	'empty cart': body => { body.cart.items = [] },
	'negative quantity': body => { body.cart.items[0].quantity = -1 },
	'zero quantity': body => { body.cart.items[0].quantity = 0 },
	'fractional quantity': body => { body.cart.items[0].quantity = 0.01 },
	'excessive quantity': body => { body.cart.items[0].quantity = Number.MAX_SAFE_INTEGER },
	'unknown product': body => { body.cart.items[0].id = 999 },
	'duplicate product': body => { body.cart.items.push({ ...body.cart.items[0] }) },
	'one-cent total': body => { body.cart.totalWithShipping = 0.01 },
	'negative total': body => { body.cart.totalWithShipping = -10 },
	'forged shipping': body => { body.cart.shipping = 0 },
	'forged price': body => { body.cart.items[0].price = 0.01 },
	'forged product name': body => { body.cart.items[0].name = 'Another product' },
	'missing address': body => { body.customer.address = ' ' },
	'unaccepted terms': body => { body.customer.terms = false },
	'invalid email': body => { body.customer.email = 'invalid' },
	'missing retry key': body => { delete body.orderId },
}

for (const [name, mutate] of Object.entries(invalidCases)) {
	test(`rejects ${name} without sending email`, async () => {
		const api = harness()
		const body = order()
		mutate(body)
		assert.equal((await api.post(body)).status, 400)
		assert.equal(api.calls.length, 0)
	})
}

test('rejects malformed JSON', async () => {
	const api = harness()
	assert.equal((await api.post('{')).status, 400)
	assert.equal(api.calls.length, 0)
})

for (const key of Object.keys(environment)) {
	test(`requires ${key} before sending either email`, async () => {
		const api = harness({ env: { ...environment, [key]: '' } })
		assert.equal((await api.post(order())).status, 503)
		assert.equal(api.calls.length, 0)
	})
}

test('rejects an invalid owner address', async () => {
	const api = harness({ env: { ...environment, ORDER_OWNER_EMAIL: 'invalid' } })
	assert.equal((await api.post(order())).status, 503)
	assert.equal(api.calls.length, 0)
})

for (const [items, expected] of [
	[[{ id: 4, quantity: 1 }], 114.99],
	[[{ id: 0, quantity: 3 }], 36.6],
	[[{ id: 1, quantity: 10 }, { id: 0, quantity: 2 }, { id: 2, quantity: 2 }], 163.8],
	[[{ id: 1, quantity: 10 }, { id: 5, quantity: 2 }], 164.8],
	[[{ id: 1, quantity: 5 }, { id: 5, quantity: 6 }, { id: 0, quantity: 3 }], 171],
]) {
	test(`calculates catalog total ${expected} EUR in cents`, async () => {
		const api = harness()
		const body = order()
		body.cart.items = items
		const response = await api.post(body)
		assert.equal(response.status, 200)
		assert.equal((await response.json()).totalWithShipping, expected)
		assert.equal(api.calls[0].emails.length, 2)
		const formatted = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(expected)
		for (const email of api.calls[0].emails) assert.ok(email.html.includes(formatted))
	})
}

test('uses server-side translated names and sends both messages as one batch', async () => {
	const api = harness()
	const body = order()
	body.lng = 'de'
	assert.equal((await api.post(body)).status, 200)
	assert.equal(api.calls.length, 1)
	assert.equal(api.calls[0].emails[0].to, environment.ORDER_OWNER_EMAIL)
	assert.equal(api.calls[0].emails[1].to, body.customer.email)
	const translations = JSON.parse(readFileSync(path.join(root, 'app/i18n/locales/de/translations.json'), 'utf8'))
	assert.ok(api.calls[0].emails[1].html.includes(translations.products.products.cabinet))
})

test('lost response retries keep the same order number and provider idempotency key', async () => {
	const api = harness({ mode: 'lost-response' })
	const body = order()
	assert.equal((await api.post(body)).status, 502)
	const response = await api.post(body)
	assert.equal(response.status, 200)
	const { orderNumber } = await response.json()
	assert.match(orderNumber, /^IND-\d{10}$/)
	for (const email of api.calls[0].emails) {
		assert.ok(email.subject.includes(orderNumber))
		assert.ok(email.html.includes(orderNumber))
		assert.ok(!email.html.includes(body.orderId))
	}
	assert.equal(api.calls[0].options.idempotencyKey, `order/${body.orderId}`)
	assert.equal(api.deliveries.size, 1)
	assert.equal(JSON.stringify(api.calls[0]), JSON.stringify(api.calls[1]))
})

test('concurrent requests use the same batch identity', async () => {
	const api = harness()
	const body = order()
	const responses = await Promise.all([api.post(body), api.post(body)])
	assert.ok(responses.every(response => response.status === 200))
	assert.equal(api.deliveries.size, 1)
})

for (const mode of ['reject', 'incomplete']) {
	test(`does not report success for ${mode} batch`, async () => {
		const api = harness({ mode })
		assert.equal((await api.post(order())).status, 502)
	})
}

test('rejects retries outside the provider deduplication window', async () => {
	const api = harness()
	const body = order()
	body.createdAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
	const response = await api.post(body)
	assert.equal(response.status, 409)
	assert.equal((await response.json()).code, 'ORDER_EXPIRED')
	assert.equal(api.calls.length, 0)
})

test('browser retry identity survives remounts and persists no customer details', async () => {
	const saved = new Map()
	const sessionStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) }
	const load = () => loadModule('src/lib/order-attempt.ts', {}, {}, { sessionStorage })
	const payload = JSON.stringify({ customer: { email: 'buyer@example.invalid' }, cart: [{ id: 4, quantity: 1 }] })
	const first = await load().getOrderAttempt(payload)
	const retry = await load().getOrderAttempt(payload)
	assert.equal(first.orderId, retry.orderId)
	assert.equal(first.createdAt, retry.createdAt)
	assert.ok(![...saved.values()].join('').includes('buyer@example.invalid'))
	const different = await load().getOrderAttempt(payload + ' ')
	assert.notEqual(first.orderId, different.orderId)
	assert.equal((await load().getOrderAttempt(payload)).orderId, first.orderId)
})
