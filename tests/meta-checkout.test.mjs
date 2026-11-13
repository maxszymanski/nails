import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { XMLParser } from 'fast-xml-parser'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const plain = value => JSON.parse(JSON.stringify(value))

function loadModule(relativePath, overrides = {}, globals = {}, cache = new Map()) {
	const filename = path.resolve(root, relativePath)
	if (cache.has(filename)) return cache.get(filename)
	if (filename.endsWith('.json')) return JSON.parse(readFileSync(filename, 'utf8'))
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
	}).outputText
	const exports = {}
	cache.set(filename, exports)
	const localRequire = name => {
		if (Object.hasOwn(overrides, name)) return overrides[name]
		if (name.startsWith('@/') || name.startsWith('.')) {
			const target = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name)
			const extension = path.extname(target) ? '' : existsSync(target + '.tsx') ? '.tsx' : '.ts'
			return loadModule(target + extension, overrides, globals, cache)
		}
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, { URL, URLSearchParams, ...globals }, { filename })(localRequire, exports)
	return exports
}

const { products } = loadModule('src/data/products.ts')
const { parseMetaCheckout } = loadModule('src/lib/meta-checkout.ts')
const { productFeedXml } = loadModule('src/lib/product-feed.ts')
const input = products => ({ products })

for (const [value, expected] of [
	['ind-nails:1', [[0, 1]]],
	['ind-nails:3', [[0, 3]]],
	['ind-nails:2,ind-frame:1', [[0, 2], [3, 1]]],
	['ind-cabinet:2,ind-magnetic:17', [[4, 2], [1, 17]]],
	['ind-nails:1000', [[0, 1000]]],
]) {
	test(`imports exact catalog quantities: ${value}`, () => {
		const result = parseMetaCheckout(input(value))
		assert.equal(result.ok, true)
		assert.deepEqual(Array.from(result.items, item => [item.id, item.quantity]), expected)
		for (const item of result.items) {
			const product = products.find(product => product.id === item.id)
			assert.equal(item.price, product.price)
			assert.equal(item.name, product.name)
			assert.equal(item.slug, product.slug)
			assert.equal(item.image, product.images[0])
		}
	})
}

test('all content IDs map directly from the unchanged feed, not Meta Graph or internal IDs', () => {
	const feed = new XMLParser().parse(productFeedXml()).rss.channel.item
	for (const item of feed) {
		const result = parseMetaCheckout(input(`${item['g:id']}:1`))
		assert.equal(result.ok, true)
		assert.equal(products.find(product => product.sku === item['g:id']).id, result.items[0].id)
	}
})

test('decodes separators exactly once and ignores URL prices and redirect targets', () => {
	const url = new URL('https://example.invalid/de/meta-checkout?products=ind-nails%3A3%2Cind-display%3A2&price=0.01&total=-1&redirect=https%3A%2F%2Fevil.invalid&fbclid=test')
	const result = parseMetaCheckout(Object.fromEntries(url.searchParams))
	assert.equal(result.ok, true)
	assert.deepEqual(Array.from(result.items, item => [item.id, item.quantity, item.price]), [[0, 3, 7.2], [5, 2, 14.9]])
	assert.equal(parseMetaCheckout(input('ind-nails%3A1')).ok, false)
})

for (const [params, code] of [
	[{}, 'MISSING_PRODUCTS'], [input(''), 'MISSING_PRODUCTS'],
	[input(['ind-nails:1', 'ind-frame:1']), 'INVALID_PRODUCTS'],
	[input('ind-nails'), 'INVALID_PRODUCTS'], [input(':1'), 'INVALID_PRODUCTS'],
	[input('ind-nails:1:2'), 'INVALID_PRODUCTS'], [input('ind-nails:1,'), 'INVALID_PRODUCTS'],
	[input('x'.repeat(2049)), 'INVALID_PRODUCTS'],
	[input(Array(7).fill('ind-nails:1').join(',')), 'INVALID_PRODUCTS'],
	[input('missing:1'), 'UNKNOWN_PRODUCT'], [input('0:1'), 'UNKNOWN_PRODUCT'],
	[input('IND-NAILS:1'), 'UNKNOWN_PRODUCT'], [input('__proto__:1'), 'UNKNOWN_PRODUCT'],
	[input('constructor:1'), 'UNKNOWN_PRODUCT'], [input('<script>:1'), 'UNKNOWN_PRODUCT'],
	[input('ind-nails:1,ind-nails:2'), 'DUPLICATE_PRODUCT'],
	[input('ind-nails:1001'), 'WEIGHT_LIMIT'], [input('ind-cabinet:14'), 'WEIGHT_LIMIT'],
	[input('ind-nails:999,ind-magnetic:1'), 'WEIGHT_LIMIT'],
	[{ products: 'ind-nails:1', coupon: ['a', 'b'] }, 'INVALID_PRODUCTS'],
	[{ products: 'ind-nails:1', coupon: 'SUMMERSALE20' }, 'COUPON_UNSUPPORTED'],
]) {
	test(`rejects ${JSON.stringify(params).slice(0, 90)} as ${code}`, () => {
		assert.deepEqual(plain(parseMetaCheckout(params)), { ok: false, code })
	})
}

for (const quantity of ['', '0', '-1', '1.5', '1.0', '01', '+1', ' 1', '1 ', '1\n', '1e3', '0x10', 'NaN', 'Infinity', '10001', '9007199254740992']) {
	test(`rejects non-canonical or excessive quantity ${JSON.stringify(quantity)}`, () => {
		assert.deepEqual(plain(parseMetaCheckout(input(`ind-nails:${quantity}`))), { ok: false, code: 'INVALID_QUANTITY' })
	})
}

test('rejects unavailable products atomically and accepts an absent or empty coupon', () => {
	const { parseMetaCheckout: parse } = loadModule('src/lib/meta-checkout.ts', {
		'@/src/data/products': { products: products.map(product => ({ ...product, inStock: product.id !== 3 })) },
	})
	assert.deepEqual(plain(parse(input('ind-nails:2,ind-frame:1'))), { ok: false, code: 'UNAVAILABLE_PRODUCT' })
	for (const coupon of [undefined, '', '   ']) assert.equal(parseMetaCheckout({ products: 'ind-nails:1', coupon }).ok, true)
})

function cartHarness() {
	let stored = JSON.stringify({ state: { items: [{ id: 4, name: 'cabinet', quantity: 8 }] }, version: 0 })
	let writes = 0
	const sessionStorage = { getItem: () => stored, setItem: (_, value) => { stored = value; writes++ } }
	const { useCartStore } = loadModule('src/components/stores/CartStore.ts', {}, { sessionStorage })
	const { default: modal } = loadModule('src/components/stores/modalStore.ts')
	return { useCartStore, modal, stored: () => JSON.parse(stored).state.items, writes: () => writes }
}

function mountImport(result, harness) {
	const effects = []
	const failures = []
	const fakeModal = selector => selector(harness.modal.getState())
	fakeModal.getState = harness.modal.getState
	const { default: Component } = loadModule('src/components/ui/MetaCheckout.tsx', {
		react: { ...React, useEffect: effect => effects.push(effect), useRef: () => ({ current: false }), useState: () => [false, value => failures.push(value)] },
		'@/app/i18n/client': { useT: () => ({ t: key => key }) },
		'next/navigation': { useRouter: () => ({}) },
		'../stores/CartStore': { useCartStore: harness.useCartStore },
		'../stores/modalStore': { __esModule: true, default: fakeModal },
	})
	Component({ result, lng: 'de' })
	return { effect: effects[0], failures }
}

test('valid imports replace the persisted old cart, remain idempotent on re-entry and preserve ordinary addItem behavior', async () => {
	const harness = cartHarness()
	const result = parseMetaCheckout(input('ind-nails:3,ind-frame:1'))
	for (let visit = 0; visit < 2; visit++) {
		const mount = mountImport(result, harness)
		const cleanup = mount.effect()
		await new Promise(setImmediate)
		assert.deepEqual(plain(harness.useCartStore.getState().items), plain(result.items))
		assert.deepEqual(harness.stored(), plain(result.items))
		assert.equal(harness.modal.getState().openModal, 'cart')
		cleanup()
		assert.equal(harness.modal.getState().openModal, null)
	}
	assert.equal(harness.writes(), 2)
	harness.useCartStore.getState().addItem(products[0], 2)
	assert.equal(harness.useCartStore.getState().items.find(item => item.id === 0).quantity, 5)
	harness.modal.getState().setOpenModal('cart')
	assert.equal(harness.modal.getState().openModal, 'cart')
})

test('Strict Mode cancellation never applies an abandoned import or doubles quantities', async () => {
	const harness = cartHarness()
	const result = parseMetaCheckout(input('ind-magnetic:4'))
	const mount = mountImport(result, harness)
	mount.effect()()
	const cleanup = mount.effect()
	await new Promise(setImmediate)
	assert.deepEqual(harness.stored(), plain(result.items))
	assert.equal(harness.writes(), 1)
	assert.equal(harness.modal.getState().modalVersion, 1)
	cleanup()
})

test('invalid IDs, quantities, overweight carts and unsupported coupons leave the old cart untouched', async () => {
	for (const params of [input('bad:1'), input('ind-nails:0'), input('ind-cabinet:14'), { products: 'ind-nails:1', coupon: 'SALE' }]) {
		const harness = cartHarness()
		const before = plain(harness.useCartStore.getState().items)
		mountImport(parseMetaCheckout(params), harness).effect()
		await new Promise(setImmediate)
		assert.deepEqual(plain(harness.useCartStore.getState().items), before)
		assert.deepEqual(harness.stored(), before)
		assert.equal(harness.writes(), 0)
		assert.equal(harness.modal.getState().openModal, null)
	}
})

test('storage failures show an import error without opening an order form', async () => {
	const harness = cartHarness()
	harness.useCartStore.setState({ replaceItems: () => { throw new Error('Storage blocked') } })
	const mount = mountImport(parseMetaCheckout(input('ind-nails:1')), harness)
	const cleanup = mount.effect()
	await new Promise(setImmediate)
	assert.deepEqual(mount.failures, [true])
	assert.equal(harness.modal.getState().openModal, null)
	cleanup()
})

for (const lng of ['de', 'pl', 'en']) {
	test(`localized page and errors stay noindex and make no cart changes during SSR: ${lng}`, async () => {
		const copy = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
		const t = key => key.split('.').reduce((value, part) => value?.[part], copy)
		const page = loadModule('app/[lng]/meta-checkout/page.tsx', {
			'@/app/i18n': { getT: async () => ({ t }) },
			'@/app/i18n/client': { useT: () => ({ t }) },
			'next/navigation': { useRouter: () => ({}) },
			'next/link': { __esModule: true, default: 'a' },
		})
		const metadata = await page.generateMetadata({ params: Promise.resolve({ lng }) })
		assert.equal(metadata.robots.index, false)
		assert.equal(metadata.alternates.canonical, `https://www.iwonnaildisplay.de/${lng}/meta-checkout`)
		assert.equal(page.dynamic, 'force-dynamic')
		for (const code of ['MISSING_PRODUCTS', 'INVALID_PRODUCTS', 'UNKNOWN_PRODUCT', 'INVALID_QUANTITY', 'DUPLICATE_PRODUCT', 'UNAVAILABLE_PRODUCT', 'COUPON_UNSUPPORTED', 'IMPORT_FAILED']) {
			assert.equal(typeof t(`metaCheckout.errors.${code}`), 'string')
		}
		for (const value of ['bad:1', 'ind-nails:1']) {
			const html = renderToStaticMarkup(await page.default({ params: Promise.resolve({ lng }), searchParams: Promise.resolve(input(value)) }))
			if (value === 'bad:1') {
				assert.ok(html.includes('role="alert"'))
				assert.ok(html.includes(renderToStaticMarkup(copy.metaCheckout.errors.UNKNOWN_PRODUCT)))
			}
			assert.match(html, new RegExp(`href="/${lng}/produkte" class="[^"]*rounded-full[^"]*"`))
			assert.ok(!html.includes('mailto:'))
		}
	})
}

test('Meta uses the ordinary first cart step without an extra order-form summary', () => {
	const result = parseMetaCheckout(input('ind-nails:3,ind-frame:1'))
	const { default: CartModal } = loadModule('src/components/ui/CartModal.tsx', {
		'@/app/i18n/client': { useT: () => ({ t: key => key }) },
		'../stores/CartStore': { useCartStore: selector => selector({ items: result.items }) },
		'../stores/modalStore': { __esModule: true, default: selector => selector({ closeModal() {} }) },
		'./Modal': { __esModule: true, default: ({ children }) => React.createElement('div', null, children) },
		'./OrderForm': { __esModule: true, default: () => { throw new Error('The form must not open before continuing from the cart') } },
		'./CartProduct': { __esModule: true, default: ({ product }) => React.createElement('div', { 'data-product': product.id, 'data-quantity': product.quantity }) },
		'./LogoLink': { __esModule: true, default: () => null },
		'./CompatibleProducts': { __esModule: true, default: () => null },
	})
	const ordinary = renderToStaticMarkup(React.createElement(CartModal))
	assert.ok(!ordinary.includes('existing-order-form'))
	assert.ok(ordinary.includes('cart.quote'))
	assert.ok(ordinary.includes('data-product="0" data-quantity="3"'))
	assert.ok(ordinary.includes('data-product="3" data-quantity="1"'))
	assert.ok(!ordinary.includes('<ul'))
	assert.ok(!ordinary.match(/<h2[^>]*>/)[0].includes('tabindex'))
})

test('language switching keeps Meta products, coupon and attribution without changing ordinary page navigation', () => {
	for (const pathname of ['/de/meta-checkout', '/de/produkte']) {
		const navigations = []
		const query = '?products=ind-nails%3A3%2Cind-frame%3A1&coupon=SALE&fbclid=abc&utm_source=instagram'
		const { default: Switcher } = loadModule('src/components/nav/LanguageSwitcher.tsx', {
			react: { ...React, useEffect() {}, useId: () => 'language', useRef: () => ({ current: null }), useState: () => [true, () => {}] },
			'@/app/i18n/client': { useT: () => ({ t: key => key }) },
			'next/navigation': { useRouter: () => ({ push: target => navigations.push(target) }), usePathname: () => pathname },
		}, { window: { location: { search: query } } })
		const tree = Switcher({ lng: 'de' })
		function findEnglish(node) {
			if (!React.isValidElement(node)) return undefined
			if (node.type === 'button' && node.props.lang === 'en') return node
			return React.Children.toArray(node.props.children).map(findEnglish).find(Boolean)
		}
		findEnglish(tree).props.onClick()
		assert.deepEqual(navigations, [pathname === '/de/meta-checkout' ? `/en/meta-checkout${query}` : '/en/produkte'])
	}
})
