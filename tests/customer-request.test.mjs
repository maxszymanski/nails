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
	WITHDRAWAL_FROM_EMAIL: 'Returns <returns-sender@example.invalid>',
	COMPLAINT_FROM_EMAIL: 'Complaints <complaints-sender@example.invalid>',
	WITHDRAWAL_OWNER_EMAIL: 'returns@example.invalid',
	COMPLAINT_OWNER_EMAIL: 'complaints@example.invalid',
}

function loadModule(relativePath, overrides = {}, env = environment, globals = {}, cache = new Map()) {
	const filename = path.join(root, relativePath)
	if (filename.endsWith('.json')) return JSON.parse(readFileSync(filename, 'utf8'))
	if (cache.has(filename)) return cache.get(filename)
	const exports = {}
	cache.set(filename, exports)
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
	}).outputText
	const localRequire = name => {
		if (name in overrides) return overrides[name]
		if (name.startsWith('@/') || name.startsWith('.')) {
			const target = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name)
			return loadModule(path.relative(root, target + (path.extname(target) ? '' : '.ts')), overrides, env, globals, cache)
		}
		if (name === 'zod') return require(name)
		throw new Error(`Unexpected test dependency: ${name}`)
	}
	vm.runInNewContext(`(function(require, exports, process) { ${compiled}\n })`, {
		Response, TextEncoder, crypto: webcrypto, ...globals,
	}, { filename })(localRequire, exports, { env })
	return exports
}

function submission(kind = 'withdrawal', lng = 'pl') {
	return {
		kind, lng, requestId: randomUUID(), createdAt: new Date().toISOString(),
		data: {
			firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.invalid', orderNumber: 'IND-1234567890', terms: true,
			...(kind === 'withdrawal'
				? { scope: 'selected', returnedProducts: 'IND Nails, 2 packs' }
				: { product: 'nails', problem: 'damaged', description: 'Damaged product.\nPlease help.', resolution: 'replacement' }),
		},
	}
}

function harness({ env = environment, mode } = {}) {
	const calls = []
	const deliveries = new Map()
	let firstCall = true
	class Resend {
		batch = { send: async (emails, options) => {
			calls.push({ emails, options })
			const serialized = JSON.stringify(emails)
			const previous = deliveries.get(options.idempotencyKey)
			if (previous && previous !== serialized) return { error: { name: 'invalid_idempotent_request' } }
			if (mode === 'reject') return { error: { name: 'validation_error', message: 'Private provider detail' } }
			if (mode === 'incomplete') return { data: { data: [{ id: 'one' }] }, error: null }
			deliveries.set(options.idempotencyKey, serialized)
			if (mode === 'lost-response' && firstCall) {
				firstCall = false
				throw new Error('Connection lost after acceptance')
			}
			return { data: { data: emails.map((_, index) => ({ id: String(index) })) }, error: null }
		} }
	}
	const route = loadModule('app/api/customer-request/route.ts', { resend: { Resend } }, env)
	return {
		calls, deliveries,
		post: body => route.POST(new Request('http://localhost/api/customer-request', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: typeof body === 'string' ? body : JSON.stringify(body),
		})),
	}
}

for (const kind of ['withdrawal', 'complaint']) {
	for (const lng of ['pl', 'en', 'de']) {
		test(`${kind} sends a German owner notification and localized customer receipt in ${lng}`, async () => {
			const api = harness()
			const body = submission(kind, lng)
			assert.deepEqual(await (await api.post(body)).json(), { ok: true })
			assert.equal(api.calls.length, 1)
			const { emails: [owner, customer], options } = api.calls[0]
			const ownerAddress = kind === 'withdrawal' ? environment.WITHDRAWAL_OWNER_EMAIL : environment.COMPLAINT_OWNER_EMAIL
			const senderAddress = kind === 'withdrawal' ? environment.WITHDRAWAL_FROM_EMAIL : environment.COMPLAINT_FROM_EMAIL
			assert.equal(owner.to, ownerAddress)
			assert.equal(owner.replyTo, body.data.email)
			assert.equal(customer.to, body.data.email)
			assert.equal(customer.replyTo, ownerAddress)
			assert.equal(options.batchValidation, 'strict')
			assert.equal(options.idempotencyKey, `${kind}/${body.requestId}`)
			const t = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
			const german = JSON.parse(readFileSync(path.join(root, 'app/i18n/locales/de/translations.json'), 'utf8'))
			assert.ok(customer.subject.includes(t.customerRequestEmail[kind].subject))
			assert.ok(customer.html.includes(t.customerRequestEmail[kind].message))
			assert.ok(owner.html.includes(`lang="de"`))
			assert.ok(owner.subject.startsWith(kind === 'withdrawal' ? 'Neuer Widerruf #' : 'Neue Reklamation #'))
			for (const value of [german.customerRequestEmail.ownerIntro, german.customerRequestEmail.detailsTitle, german.customerRequestEmail.language, 'Inhaber: Tomasz Ptaszynski']) {
				assert.ok(owner.text.includes(value), value)
			}
			assert.ok(customer.html.includes(`lang="${lng}"`))
			for (const mail of [owner, customer]) {
				assert.equal(mail.from, senderAddress)
				assert.ok(mail.subject.includes(body.data.orderNumber))
				for (const value of [body.data.firstName, body.data.lastName, body.data.email, body.data.orderNumber, 'Tomasz Ptaszynski', 'DE238234451']) {
					assert.ok(mail.html.includes(value), value)
					assert.ok(mail.text.includes(value), value)
				}
				for (const color of ['#725fff', '#f2f2f2', '#ffffff', '#e5e5e5']) assert.ok(mail.html.includes(color))
				assert.ok(mail.html.includes('max-width: 500px'))
			}
			if (kind === 'withdrawal') {
				assert.ok(owner.text.includes(body.data.returnedProducts))
				assert.ok(owner.text.includes(german.withdrawalForm.selected))
				assert.ok(customer.text.includes(t.withdrawalForm.selected))
			} else {
				for (const value of [t.products.products.nails, t.complaintForm.problems.damaged, t.complaintForm.resolutions.replacement, body.data.description]) {
					assert.ok(customer.text.includes(value), value)
				}
				for (const value of [german.products.products.nails, german.complaintForm.problems.damaged, german.complaintForm.resolutions.replacement, body.data.description]) {
					assert.ok(owner.text.includes(value), value)
				}
			}
		})
	}
	for (const [name, mutate] of Object.entries({
		'missing first name': body => { delete body.data.firstName },
		'invalid last name': body => { body.data.lastName = '<script>' },
		'invalid email': body => { body.data.email = 'not-an-email' },
		'missing order': body => { delete body.data.orderNumber },
		'invalid order': body => { body.data.orderNumber = '1e12345678' },
		'unacknowledged policy': body => { body.data.terms = false },
		'missing request identity': body => { delete body.requestId },
		'invalid language': body => { body.lng = 'plx' },
		'invalid kind': body => { body.kind = 'order' },
		'forged recipient': body => { body.to = 'attacker@example.invalid' },
		'invalid date': body => { body.createdAt = 'yesterday' },
	})) {
		test(`${kind} rejects ${name} before sending`, async () => {
			const api = harness()
			const body = submission(kind)
			mutate(body)
			assert.equal((await api.post(body)).status, 400)
			assert.equal(api.calls.length, 0)
		})
	}
	for (const variable of ['RESEND_API_KEY', kind === 'withdrawal' ? 'WITHDRAWAL_FROM_EMAIL' : 'COMPLAINT_FROM_EMAIL', kind === 'withdrawal' ? 'WITHDRAWAL_OWNER_EMAIL' : 'COMPLAINT_OWNER_EMAIL']) {
		test(`${kind} requires ${variable} without depending on payment configuration`, async () => {
			const api = harness({ env: { ...environment, [variable]: '' } })
			assert.equal((await api.post(submission(kind))).status, 503)
			assert.equal(api.calls.length, 0)
		})
	}
	test(`${kind} only requires its own sender and owner addresses`, async () => {
		const env = { ...environment }
		delete env.ORDER_FROM_EMAIL
		delete env[kind === 'withdrawal' ? 'COMPLAINT_FROM_EMAIL' : 'WITHDRAWAL_FROM_EMAIL']
		delete env[kind === 'withdrawal' ? 'COMPLAINT_OWNER_EMAIL' : 'WITHDRAWAL_OWNER_EMAIL']
		assert.equal((await harness({ env }).post(submission(kind))).status, 200)
	})
	test(`${kind} keeps its sender when testing with a personal recipient`, async () => {
		const ownerKey = kind === 'withdrawal' ? 'WITHDRAWAL_OWNER_EMAIL' : 'COMPLAINT_OWNER_EMAIL'
		const senderKey = kind === 'withdrawal' ? 'WITHDRAWAL_FROM_EMAIL' : 'COMPLAINT_FROM_EMAIL'
		const api = harness({ env: { ...environment, [ownerKey]: 'personal@gmail.com' } })
		assert.equal((await api.post(submission(kind))).status, 200)
		const [owner, customer] = api.calls[0].emails
		assert.equal(owner.to, 'personal@gmail.com')
		assert.equal(customer.replyTo, 'personal@gmail.com')
		for (const email of [owner, customer]) assert.equal(email.from, environment[senderKey])
	})
	test(`${kind} trims sender whitespace`, async () => {
		const senderKey = kind === 'withdrawal' ? 'WITHDRAWAL_FROM_EMAIL' : 'COMPLAINT_FROM_EMAIL'
		const api = harness({ env: { ...environment, [senderKey]: ` ${environment[senderKey]} ` } })
		assert.equal((await api.post(submission(kind))).status, 200)
		for (const email of api.calls[0].emails) assert.equal(email.from, environment[senderKey])
	})
	test(`${kind} does not duplicate messages after a lost provider response`, async () => {
		const api = harness({ mode: 'lost-response' })
		const body = submission(kind)
		assert.equal((await api.post(body)).status, 502)
		assert.equal((await api.post(body)).status, 200)
		assert.equal(api.deliveries.size, 1)
		assert.equal(JSON.stringify(api.calls[0]), JSON.stringify(api.calls[1]))
	})
	for (const age of [23 * 60 * 60 * 1000 + 1000, -10 * 60 * 1000]) {
		test(`${kind} rejects timestamps outside the safe retry window: ${age}`, async () => {
			const api = harness()
			const body = submission(kind)
			body.createdAt = new Date(Date.now() - age).toISOString()
			const response = await api.post(body)
			assert.equal(response.status, 409)
			assert.equal((await response.json()).code, 'REQUEST_EXPIRED')
			assert.equal(api.calls.length, 0)
		})
	}
	for (const mode of ['reject', 'incomplete']) {
		test(`${kind} reports ${mode} batches as failures without exposing provider details`, async () => {
			const response = await harness({ mode }).post(submission(kind))
			assert.equal(response.status, 502)
			assert.ok(!(await response.text()).includes('Private provider detail'))
		})
	}
}

test('rejects malformed JSON', async () => {
	const api = harness()
	assert.equal((await api.post('{')).status, 400)
	assert.equal(api.calls.length, 0)
})

for (const [kind, field, value] of [
	['withdrawal', 'scope', 'other'], ['withdrawal', 'returnedProducts', ' '], ['withdrawal', 'returnedProducts', 'a'.repeat(2001)],
	['complaint', 'product', 'other'], ['complaint', 'problem', 'other-value'], ['complaint', 'resolution', 'other'],
	['complaint', 'description', ' '], ['complaint', 'description', 'a'.repeat(5001)],
]) {
	test(`server validates ${kind} ${field} (${value.length} characters)`, async () => {
		const api = harness()
		const body = submission(kind)
		body.data[field] = value
		assert.equal((await api.post(body)).status, 400)
		assert.equal(api.calls.length, 0)
	})
}

test('whole-order withdrawal does not include stale selected-product text', async () => {
	const api = harness()
	const body = submission()
	body.data.scope = 'all'
	assert.equal((await api.post(body)).status, 200)
	for (const mail of api.calls[0].emails) assert.ok(!mail.text.includes(body.data.returnedProducts))
})

for (const kind of ['withdrawal', 'complaint']) {
	test(`${kind} escapes user text in both HTML messages and preserves line breaks`, async () => {
		const api = harness()
		const body = submission(kind)
		const field = kind === 'withdrawal' ? 'returnedProducts' : 'description'
		body.data[field] = '<img src=x onerror="alert(1)"> & test\nsecond line'
		assert.equal((await api.post(body)).status, 200)
		for (const email of api.calls[0].emails) {
			assert.ok(email.html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; test\nsecond line'))
			assert.ok(!email.html.includes('<img src=x'))
			assert.ok(email.text.includes(body.data[field]))
		}
	})
}

function browserHarness(fetch, { cleanupFails = false } = {}) {
	const saved = new Map()
	const sessionStorage = {
		getItem: key => saved.get(key) ?? null,
		setItem: (key, value) => saved.set(key, value),
		removeItem: key => { if (cleanupFails) throw new Error('Storage unavailable'); saved.delete(key) },
	}
	return {
		saved,
		load: () => loadModule('src/lib/submit-customer-request.ts', {}, {}, { fetch, sessionStorage }).submitCustomerRequest,
	}
}

test('client retries and remounts reuse an identity without storing personal data, then clear it on success', async () => {
	const calls = []
	const browser = browserHarness(async (url, options) => {
		assert.equal(url, '/api/customer-request')
		calls.push(JSON.parse(options.body))
		if (calls.length === 1) throw new Error('Network failure')
		return Response.json({ ok: true })
	})
	const { requestId, createdAt, ...payload } = submission('complaint')
	void requestId
	void createdAt
	await assert.rejects(browser.load()(payload))
	assert.equal(browser.saved.size, 1)
	assert.ok(!JSON.stringify([...browser.saved]).includes(payload.data.email))
	await browser.load()(payload)
	assert.deepEqual(calls[0], calls[1])
	assert.equal(browser.saved.size, 0)
})

for (const [status, result, expected] of [[502, { error: 'failure' }, 'REQUEST_FAILED'], [409, { code: 'REQUEST_EXPIRED' }, 'REQUEST_EXPIRED'], [200, {}, 'REQUEST_FAILED']]) {
	test(`client preserves retry identity on ${status} ${expected}`, async () => {
		const browser = browserHarness(async () => Response.json(result, { status }))
		await assert.rejects(browser.load()(submission()), error => error.message === expected)
		assert.equal(browser.saved.size, 1)
	})
}

test('different request content creates a different retry identity', async () => {
	const ids = []
	const browser = browserHarness(async (_url, options) => {
		ids.push(JSON.parse(options.body).requestId)
		return Response.json({ error: 'failure' }, { status: 502 })
	})
	await assert.rejects(browser.load()(submission('withdrawal')))
	await assert.rejects(browser.load()(submission('complaint')))
	assert.notEqual(ids[0], ids[1])
})

test('storage cleanup failure cannot turn successful email acceptance into an error', async () => {
	const browser = browserHarness(async () => Response.json({ ok: true }), { cleanupFails: true })
	await browser.load()(submission())
})
