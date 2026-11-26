import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))

function loadModule(relativePath, lng = 'de') {
	const filename = path.join(root, relativePath)
	const translations = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
	const t = key => {
		const value = key.split('.').reduce((copy, part) => copy?.[part], translations)
		assert.ok(typeof value === 'string' || Array.isArray(value), `Missing translation: ${key}`)
		return value
	}
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
	}).outputText
	const exports = {}
	const localRequire = name => {
		if (name === '@/app/i18n') return { getT: async () => ({ t }) }
		if (name === '@/app/i18n/client') return { useT: () => ({ t }) }
		if (name === 'next/link') return { __esModule: true, default: 'a' }
		if (name === 'next/image') return { __esModule: true, default: props => createElement('img', { ...props, fill: undefined }) }
		if (name === 'next/navigation') return { notFound() { throw new Error('Unexpected missing product') } }
		if (name === '../stores/CartStore') return { useCartStore: selector => selector({ addItem() {}, increase() {}, decrease() {}, remove() {} }) }
		if (name === 'react-toastify') return { toast: { success() {} } }
		if (name === './Button') return loadModule('src/components/ui/Button.tsx', lng)
		if (name === './PriceInfoTooltip') return loadModule('src/components/ui/PriceInfoTooltip.tsx', lng)
		if (name === './LinkButton') return { __esModule: true, default: ({ children, href }) => createElement('a', { href }, children) }
		if (['@/src/components/products/AddToCard', '@/src/components/products/MobileCarousel', '@/src/components/ui/FaqAccordeon'].includes(name)) {
			return { __esModule: true, default: () => null }
		}
		if (name.startsWith('@/')) {
			const relative = name.slice(2)
			return loadModule(relative + (existsSync(path.join(root, relative + '.tsx')) ? '.tsx' : '.ts'), lng)
		}
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, { URL }, { filename })(localRequire, exports)
	return exports
}

const { products } = loadModule('src/data/products.ts')
const { getGermanGrossPrice, getDiscountedPrice, GERMAN_VAT_RATE } = loadModule('src/lib/pricing.ts')
const { calculateQuote, VAT_RATES } = loadModule('src/lib/checkout.ts')
const expectedGross = [8.57, 14.28, 8.57, 95.19, 118.99, 17.73]
const expectedSale = [6, 10, 6, 47.6, 59.5, 12.41]

test('configured discounts preserve base prices and round discounted net prices to cents', () => {
	assert.deepEqual(Array.from(products, product => product.discount), [30, 30, 30, 50, 50, 30])
	const expectedNet = [5.04, 8.4, 5.04, 40, 50, 10.43]
	for (const product of products) {
		assert.equal(getDiscountedPrice(product.price, product.discount), expectedNet[product.id])
		assert.equal(getGermanGrossPrice(getDiscountedPrice(product.price, product.discount)), expectedSale[product.id])
		assert.equal(getDiscountedPrice(product.price), product.price)
		assert.equal(getDiscountedPrice(product.price, 0), product.price)
	}
	assert.equal(getDiscountedPrice(1.01, 25), 0.76)
})

test('invalid discount configuration cannot publish invalid prices', () => {
	for (const discount of [-1, 100, 101, NaN, Infinity]) {
		assert.throws(() => getDiscountedPrice(7.2, discount), /Discount must be between 0 and 100/)
	}
})

test('German discounted prices match checkout cents without changing the base catalog', () => {
	assert.equal(GERMAN_VAT_RATE, 19)
	assert.equal(VAT_RATES.DE, GERMAN_VAT_RATE)
	assert.deepEqual(Array.from(products, product => product.price), [7.2, 12, 7.2, 79.99, 99.99, 14.9])
	for (const product of products) {
		assert.equal(getGermanGrossPrice(product.price), expectedGross[product.id])
		const quote = calculateQuote({ items: [{ id: product.id, quantity: 1 }] }, 'DE')
		assert.equal(Math.round(expectedSale[product.id] * 100), quote.subtotalCents + quote.productVatCents)
		assert.equal(quote.discountCents, Math.round(product.price * 100) - quote.subtotalCents)
	}
})

for (const quantity of [2, 3, 7, 13]) {
	test(`German checkout matches discounted unit gross prices for ${quantity} units`, () => {
		for (const product of products) {
			const quote = calculateQuote({ items: [{ id: product.id, quantity }] }, 'DE')
			const unitGrossCents = Math.round(expectedSale[product.id] * 100)
			assert.equal(quote.subtotalCents + quote.productVatCents, unitGrossCents * quantity)
			assert.equal(quote.subtotalCents, Math.round(getDiscountedPrice(product.price, product.discount) * 100) * quantity)
			assert.equal(quote.discountCents, Math.round(product.price * 100) * quantity - quote.subtotalCents)
		}
	})
}

test('a mixed German cart matches discounted gross prices', () => {
	const cart = { items: products.map(product => ({ id: product.id, quantity: 3 })) }
	const quote = calculateQuote(cart, 'DE')
	const expected = expectedSale.reduce((sum, price) => sum + Math.round(price * 100) * 3, 0)
	assert.equal(quote.subtotalCents + quote.productVatCents, expected)
	assert.equal(quote.shippingCents, 0)
	assert.equal(quote.totalCents, expected)
})

test('checkout retains net amounts and destination-dependent VAT', () => {
	const cart = { items: [{ id: 0, quantity: 1 }] }
	for (const [country, rate, vat] of [['DE', 19, 96], ['PL', 23, 116], ['AE', 0, 0]]) {
		const quote = calculateQuote(cart, country)
		assert.equal(quote.subtotalCents, 504)
		assert.equal(quote.vatRate, rate)
		assert.equal(quote.productVatCents, vat)
	}
})

for (const lng of ['de', 'en', 'pl']) {
	test(`cart lines show current discounted net totals and savings, ignoring stored prices in ${lng}`, () => {
		const { default: CartProduct } = loadModule('src/components/ui/CartProduct.tsx', lng)
		const translations = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
		for (const product of products) {
			const quantity = 3
			const discounted = getDiscountedPrice(product.price, product.discount)
			const html = renderToStaticMarkup(createElement(CartProduct, {
				product: { ...product, price: 0.01, quantity, image: product.images[0] },
			}))
			const money = cents => (cents / 100).toFixed(2).replace('.', ',') + '€'
			assert.ok(html.includes(money(Math.round(product.price * 100) * quantity)))
			assert.ok(html.includes(money(Math.round(discounted * 100) * quantity)))
			assert.ok(html.includes(money((Math.round(product.price * 100) - Math.round(discounted * 100)) * quantity)))
			assert.ok(html.includes(translations.checkout.savings))
			assert.ok(html.includes('<del'))
		}
	})

	test(`both product card variants display German gross prices without net VAT captions in ${lng}`, () => {
		const { default: ProductCard } = loadModule('src/components/ui/ProductCard.tsx', lng)
		const { default: MoreCard } = loadModule('src/components/ui/MoreCard.tsx', lng)
		for (const product of products) {
			for (const html of [
				renderToStaticMarkup(createElement(ProductCard, { item: product, lng })),
				renderToStaticMarkup(createElement(MoreCard, { product, lng })),
			]) {
				assert.ok(html.includes(expectedGross[product.id].toFixed(2).replace('.', ',') + '€'))
				assert.ok(html.includes(expectedSale[product.id].toFixed(2).replace('.', ',') + '€'))
				assert.ok(html.includes('<del'))
				assert.ok(html.includes('text-[#b3263e]'))
				assert.ok(!html.includes(product.price.toFixed(2).replace('.', ',') + '€'))
				assert.ok(!html.includes('(+VAT)'))
			}
		}
	})

	test(`prices without a discount keep the ordinary presentation in ${lng}`, () => {
		const { default: ProductCard } = loadModule('src/components/ui/ProductCard.tsx', lng)
		const { default: MoreCard } = loadModule('src/components/ui/MoreCard.tsx', lng)
		for (const discount of [undefined, 0]) {
			const product = { ...products[0], discount }
			for (const html of [
				renderToStaticMarkup(createElement(ProductCard, { item: product, lng })),
				renderToStaticMarkup(createElement(MoreCard, { product, lng })),
			]) {
				assert.ok(html.includes('8,57€'))
				assert.ok(!html.includes('<del'))
				assert.ok(!html.includes('text-[#b3263e]'))
			}
		}
	})

	test(`catalog hides the price notice behind six info buttons while product pages keep their notice in ${lng}`, async () => {
		const translations = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
		const listing = loadModule('app/[lng]/produkte/page.tsx', lng)
		const detail = loadModule('app/[lng]/produkte/[slug]/page.tsx', lng)
		const listingHtml = renderToStaticMarkup(await listing.default({ params: Promise.resolve({ lng }) }))
		const infoLabel = renderToStaticMarkup(translations.products.priceInfo)
		assert.equal(listingHtml.split(`aria-label="${infoLabel}"`).length - 1, products.length)
		assert.ok(!listingHtml.includes(renderToStaticMarkup(translations.products.priceNotice)))
		assert.ok(!listingHtml.includes(`href="/${lng}/versand-zahlung"`))
		for (const html of await Promise.all(products.map(async product => {
			const tree = await detail.default({ params: Promise.resolve({ lng, slug: product.slug }) })
			const html = renderToStaticMarkup(tree)
			const data = JSON.parse(html.match(/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1])
			assert.equal(data.offers.price, expectedSale[product.id].toFixed(2))
			assert.equal(data.offers.priceCurrency, 'EUR')
			assert.equal(data.offers.availability, 'https://schema.org/InStock')
			assert.equal(data.offers.itemCondition, 'https://schema.org/NewCondition')
			assert.ok(html.includes(expectedGross[product.id].toFixed(2).replace('.', ',') + '€'))
			return html
		}))) {
			assert.ok(html.includes(renderToStaticMarkup(translations.products.priceNotice)))
			assert.ok(html.includes(renderToStaticMarkup(translations.products.shippingCosts)))
			assert.ok(html.includes(`href="/${lng}/versand-zahlung"`))
			assert.doesNotMatch(html, /\(\+VAT\)|zzgl\. gesetzlicher MwSt|plus statutory VAT|plus ustawowy podatek VAT/)
		}
	})
}
