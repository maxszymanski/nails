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
function loadModule(relativePath, overrides = {}, env = environment, globals = {}, cache = new Map()) {
	const filename = path.join(root, relativePath)
	if (cache.has(filename)) return cache.get(filename)
	if (filename.endsWith('.json')) return JSON.parse(readFileSync(filename, 'utf8'))
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
	}).outputText
	const exports = {}
	cache.set(filename, exports)
	const localRequire = name => {
		if (name in overrides) return overrides[name]
		if (name.startsWith('@/')) return loadModule(name.slice(2) + (path.extname(name) ? '' : '.ts'), overrides, env, globals, cache)
		if (name === 'zod') return require(name)
		throw new Error(`Unexpected test dependency: ${name}`)
	}
	const execute = vm.runInNewContext(`(function(require, exports, process) { ${compiled}\n })`, {
		Request, Response, URL, URLSearchParams, TextEncoder, AbortSignal, crypto: webcrypto, ...globals,
	}, { filename })
	execute(localRequire, exports, { env })
	return exports
}

function order() {
	return {
		orderId: randomUUID(),
		createdAt: new Date().toISOString(),
		lng: 'en',
		expectedTotalCents: 11899,
		expectedVatRate: 19,
		customer: {
			country: 'DE', isBusiness: false, vatId: '', companyName: '',
			firstName: 'Test', lastName: 'Buyer', address: 'Test 1', zipCode: '12345', city: 'Test',
			email: 'buyer@example.invalid', terms: true,
		},
		cart: { items: [{ id: 4, quantity: 1 }] },
	}
}

function harness({ env = environment, mode, fetch = async () => { throw new Error('Unexpected network access') } } = {}) {
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
	const route = loadModule('app/api/order/route.ts', { resend: { Resend } }, env, { fetch })
	const quoteRoute = loadModule('app/api/order/quote/route.ts', {}, env, { fetch })
	return {
		calls, deliveries,
		quote: async body => quoteRoute.POST(new Request('http://localhost/api/order/quote', {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
		})),
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
	'missing country': body => { delete body.customer.country },
	'missing company name': body => { body.customer.isBusiness = true },
	'negative expected total': body => { body.expectedTotalCents = -1 },
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

test('rejects an invalid PayPal recipient before sending email', async () => {
	const api = harness({ env: { ...environment, PAYPAL_EMAIL: 'not-an-email' } })
	assert.equal((await api.post(order())).status, 503)
	assert.equal(api.calls.length, 0)
})

for (const [lng, country, rate, amount, button] of [
	['pl', 'PL', 23, '18.76', 'Zapłać przez PayPal'],
	['de', 'DE', 19, '13.47', 'Mit PayPal bezahlen'],
	['en', 'DE', 19, '13.47', 'Pay with PayPal'],
]) {
	test(`PayPal link in ${lng} includes recipient, server total, EUR and order number`, async () => {
		const recipient = 'payments+shop@example.invalid'
		const api = harness({ env: { ...environment, PAYPAL_EMAIL: ` ${recipient} ` } })
		const body = order()
		body.lng = lng
		body.customer.country = country
		body.cart.items = [{ id: 0, quantity: 1 }]
		body.expectedVatRate = rate
		body.expectedTotalCents = Math.round(Number(amount) * 100)
		const response = await api.post(body)
		assert.equal(response.status, 200)
		const { orderNumber } = await response.json()
		const html = api.calls[0].emails[1].html
		const href = html.match(/href="(https:\/\/www\.paypal\.com\/cgi-bin\/webscr\?[^"]+)"/)?.[1]
		assert.ok(href)
		assert.ok(href.includes('&amp;'))
		const url = new URL(href.replaceAll('&amp;', '&'))
		assert.equal(url.origin, 'https://www.paypal.com')
		assert.equal(url.searchParams.get('cmd'), '_xclick')
		assert.equal(url.searchParams.get('business'), recipient)
		assert.equal(url.searchParams.get('amount'), amount)
		assert.equal(url.searchParams.get('currency_code'), 'EUR')
		assert.equal(url.searchParams.get('item_number'), orderNumber)
		assert.ok(url.searchParams.get('item_name').includes(orderNumber))
		assert.equal(url.searchParams.get('shipping'), '0.00')
		assert.equal(url.searchParams.get('tax'), '0.00')
		assert.ok(html.includes(`>${button}</a>`))
	})
}

for (const [items, expected] of [
	[[{ id: 4, quantity: 1 }], 118.99],
	[[{ id: 0, quantity: 3 }], 30.6],
	[[{ id: 1, quantity: 10 }, { id: 0, quantity: 2 }, { id: 2, quantity: 2 }], 177.07],
	[[{ id: 1, quantity: 10 }, { id: 5, quantity: 2 }], 178.26],
	[[{ id: 1, quantity: 5 }, { id: 5, quantity: 6 }, { id: 0, quantity: 3 }], 203.49],
]) {
	test(`calculates catalog total ${expected} EUR in cents`, async () => {
		const api = harness()
		const body = order()
		body.cart.items = items
		body.expectedTotalCents = Math.round(expected * 100)
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

for (const [lng, ownerLabel] of [['pl', 'Właściciel'], ['de', 'Inhaber'], ['en', 'Owner']]) {
	test(`includes company footer, bank details and contact reply address in ${lng}`, async () => {
		const api = harness({ env: { ...environment, PAYMENT_RECIPIENT: 'Recipient <test>' } })
		const body = order()
		body.lng = lng
		assert.equal((await api.post(body)).status, 200)
		const customerEmail = api.calls[0].emails[1]
		assert.equal(customerEmail.replyTo, 'Iwon@iwonnaildisplay.de')
		assert.equal(customerEmail.from, environment.ORDER_FROM_EMAIL)
		assert.ok(customerEmail.html.includes('Recipient &lt;test&gt;'))
		assert.ok(customerEmail.html.includes(environment.PAYMENT_IBAN))
		assert.ok(customerEmail.html.includes(environment.PAYMENT_BIC))
		for (const email of api.calls[0].emails) {
			for (const value of [
				`${ownerLabel}: Tomasz Ptaszynski`, 'Grillparzerstr. 12', '40699 Erkrath',
				'href="tel:+491773500405"', 'href="https://iwonnaildisplay.de/"',
				'href="mailto:Iwon@iwonnaildisplay.de"', 'DE238234451', '147/5193/3161',
			]) assert.ok(email.html.includes(value), value)
		}
	})
}

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

for (const [country, rate, productVat, shippingVat, total] of [
	['DE', 19, 137, 78, 1347],
	['PL', 23, 166, 185, 1876],
	['FI', 25.5, 184, 201, 1894],
	['EE', 24, 173, 192, 1883],
	['RO', 21, 151, 172, 1861],
	['SK', 23, 166, 185, 1876],
]) {
	test(`quotes and orders use ${rate}% VAT for ${country} and final delivery prices`, async () => {
		const api = harness()
		const body = order()
		body.cart.items = [{ id: 0, quantity: 1 }]
		Object.assign(body.customer, { country })
		body.expectedTotalCents = total
		body.expectedVatRate = rate
		const response = await api.quote({ cart: body.cart, delivery: { country, isBusiness: false, vatId: '' } })
		assert.equal(response.status, 200)
		const { quote } = await response.json()
		assert.equal(quote.productVatCents, productVat)
		assert.equal(quote.shippingVatCents, shippingVat)
		assert.equal(quote.vatCents, productVat + shippingVat)
		assert.equal(quote.shippingCents, country === 'DE' ? 490 : 990)
		assert.equal(quote.totalCents, total)
		assert.equal((await api.post(body)).status, 200)
		for (const mail of api.calls[0].emails) assert.ok(mail.html.includes(`(${rate}%)`))
	})
}

test('German free shipping threshold uses gross products, including exactly 50 EUR', () => {
	for (const [price, gross, shipping] of [[42.01, 4999, 490], [42.02, 5000, 0], [43, 5117, 0]]) {
		const { calculateQuote } = loadModule('src/lib/checkout.ts', {
			'@/src/data/products': { products: [{ id: 0, price }] },
		})
		const result = calculateQuote({ items: [{ id: 0, quantity: 1 }] }, 'DE')
		assert.equal(result.totalCents, gross + shipping)
		assert.equal(result.shippingCents, shipping)
	}
})

for (const price of [0, 0.01, -1]) {
	test(`rejects catalog subtotal ${price} before delivery or VAT`, () => {
		const { calculateQuote } = loadModule('src/lib/checkout.ts', {
			'@/src/data/products': { products: [{ id: 0, price }] },
		})
		assert.throws(() => calculateQuote({ items: [{ id: 0, quantity: 1 }] }, 'DE'), /INVALID_CART/)
	})
}

for (const country of ['US', 'TR', 'GB', 'OTHER']) {
	test(`blocks automatic orders and quotes outside EU: ${country}`, async () => {
		const api = harness()
		const body = order()
		body.customer.country = country
		const response = await api.post(body)
		assert.equal(response.status, 422)
		assert.equal((await response.json()).code, 'MANUAL_QUOTE')
		const quoted = await api.quote({ cart: body.cart, delivery: { country, isBusiness: false, vatId: '' } })
		assert.equal(quoted.status, 422)
		assert.equal(api.calls.length, 0)
	})
}

test('changing the expected price or VAT never changes the server calculation', async () => {
	for (const changes of [{ expectedTotalCents: 1 }, { expectedVatRate: 0 }]) {
		const api = harness()
		const response = await api.post({ ...order(), ...changes })
		assert.equal(response.status, 409)
		assert.equal((await response.json()).code, 'QUOTE_CHANGED')
		assert.equal(api.calls.length, 0)
	}
})

test('business customers without VAT ID and domestic companies still pay VAT', async () => {
	for (const [country, vatId, total, rate] of [['DE', 'DE123456789', 11899, 19], ['PL', '', 13289, 23]]) {
		const api = harness()
		const body = order()
		Object.assign(body.customer, { country, vatId, isBusiness: true, companyName: 'Test company' })
		Object.assign(body, { expectedTotalCents: total, expectedVatRate: rate })
		assert.equal((await api.post(body)).status, 200)
	}
})

test('cross-border companies get 0% only after VIES verification, with Greek EL prefix', async () => {
	for (const [country, vatId, prefix] of [['PL', 'PL1234567890', 'PL'], ['GR', 'EL123456789', 'EL']]) {
		let checks = 0
		const api = harness({ fetch: async (url, options) => {
			assert.equal(url, 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number')
			assert.equal(options.cache, 'no-store')
			const data = JSON.parse(options.body)
			assert.deepEqual(data, { countryCode: prefix, vatNumber: vatId.slice(2) })
			checks++
			return Response.json({ ...data, valid: true })
		} })
		const body = order()
		Object.assign(body.customer, { country, vatId, isBusiness: true, companyName: 'Company <test>' })
		Object.assign(body, { expectedTotalCents: 10989, expectedVatRate: 0 })
		const quoted = await api.quote({ cart: body.cart, delivery: { country, vatId, isBusiness: true } })
		assert.equal((await quoted.json()).quote.vatRate, 0)
		assert.equal((await api.post(body)).status, 200)
		assert.equal(checks, 2)
		for (const mail of api.calls[0].emails) {
			assert.ok(mail.html.includes('Company &lt;test&gt;'))
			assert.ok(mail.html.includes(vatId))
			assert.ok(mail.html.includes('(0%)'))
		}
	}
})

for (const [result, code, status] of [
	[{ valid: false, countryCode: 'PL', vatNumber: '1234567890' }, 'VAT_INVALID', 422],
	[{ valid: true, countryCode: 'DE', vatNumber: '1234567890' }, 'VAT_UNAVAILABLE', 503],
	[{ valid: true, countryCode: 'PL', vatNumber: '9999999999' }, 'VAT_UNAVAILABLE', 503],
	[{ userError: 'MS_UNAVAILABLE', valid: false }, 'VAT_UNAVAILABLE', 503],
	[{}, 'VAT_UNAVAILABLE', 503],
	[null, 'VAT_UNAVAILABLE', 503],
]) {
	test(`never grants 0% on invalid or unavailable VIES: ${JSON.stringify(result)}`, async () => {
		const api = harness({ fetch: async () => {
			if (result === null) throw new Error('Timeout')
			return Response.json(result)
		} })
		const body = order()
		Object.assign(body.customer, { country: 'PL', vatId: 'PL1234567890', isBusiness: true, companyName: 'Company' })
		const response = await api.post(body)
		assert.equal(response.status, status)
		assert.equal((await response.json()).code, code)
		assert.equal(api.calls.length, 0)
	})
}

test('VAT ID prefix must match the delivery country', async () => {
	const api = harness()
	const body = order()
	Object.assign(body.customer, { country: 'PL', vatId: 'DE123456789', isBusiness: true, companyName: 'Company' })
	const response = await api.post(body)
	assert.equal((await response.json()).code, 'VAT_INVALID')
	assert.equal(api.calls.length, 0)
})

test('accepts alphanumeric EU postcodes', async () => {
	const body = order()
	Object.assign(body.customer, { country: 'NL', zipCode: '1234 AB' })
	Object.assign(body, { expectedVatRate: 21, expectedTotalCents: 13089 })
	assert.equal((await harness().post(body)).status, 200)
})
