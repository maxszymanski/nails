import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))

function loadModule(relativePath, overrides = {}) {
	const filename = path.join(root, relativePath)
	if (filename.endsWith('.json')) return JSON.parse(readFileSync(filename, 'utf8'))
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
	}).outputText
	const exports = {}
	const localRequire = name => {
		if (Object.hasOwn(overrides, name)) return overrides[name]
		if (name.startsWith('@/')) return loadModule(name.slice(2) + (path.extname(name) ? '' : '.ts'), overrides)
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, { URL, Response }, { filename })(localRequire, exports)
	return exports
}

function parseFeed(xml) {
	assert.equal(XMLValidator.validate(xml), true)
	return new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(xml)
}

const { products, PRODUCT_BRAND } = loadModule('src/data/products.ts')
const { productFeedXml } = loadModule('src/lib/product-feed.ts')
const { productStructuredData } = loadModule('src/lib/structured-data.ts')
const { calculateQuote } = loadModule('src/lib/checkout.ts')
const { SITE_URL } = loadModule('src/lib/seo.ts')
const translations = JSON.parse(readFileSync(path.join(root, 'app/i18n/locales/de/translations.json'), 'utf8'))
const expectedGross = ['8.57', '14.28', '8.57', '95.19', '118.99', '17.73']
const feed = parseFeed(productFeedXml())

test('the feed is a complete UTF-8 RSS 2.0 catalog in the Google namespace', () => {
	assert.equal(feed['?xml']['@_encoding'], 'UTF-8')
	assert.equal(feed.rss['@_version'], '2.0')
	assert.equal(feed.rss['@_xmlns:g'], 'http://base.google.com/ns/1.0')
	assert.equal(feed.rss.channel.title, PRODUCT_BRAND)
	assert.equal(feed.rss.channel.link, `${SITE_URL}/de`)
	assert.equal(feed.rss.channel.language, 'de-DE')
	assert.equal(feed.rss.channel.item.length, 6)
	assert.equal(productFeedXml(), productFeedXml())
})

test('catalog identifiers are fixed, unique and separate from internal cart IDs and manufacturer codes', () => {
	assert.deepEqual(Array.from(products, product => [product.id, product.sku]), [
		[0, 'ind-nails'], [1, 'ind-magnetic'], [2, 'ind-transparent'],
		[3, 'ind-frame'], [4, 'ind-cabinet'], [5, 'ind-display'],
	])
	assert.equal(new Set(feed.rss.channel.item.map(item => item['g:id'])).size, 6)
	for (const item of feed.rss.channel.item) {
		assert.match(item['g:id'], /^[a-z0-9-]{1,50}$/)
		assert.equal(item['g:identifier_exists'], 'no')
		assert.equal(item['g:gtin'], undefined)
		assert.equal(item['g:mpn'], undefined)
		assert.equal(item['g:sale_price'], undefined)
		assert.equal(item['g:inventory'], undefined)
	}
})

for (const product of products) {
	test(`feed data for ${product.name} matches its landing page, JSON-LD and German checkout`, () => {
		const item = feed.rss.channel.item.find(item => item['g:id'] === product.sku)
		const title = translations.products.products[product.name]
		const description = translations.products.description[product.name]
		const data = productStructuredData(product, 'de', title, description)
		assert.equal(item['g:title'], title.trim())
		assert.ok(item['g:title'].length <= 150)
		assert.equal(item['g:description'], description.trim())
		assert.ok(item['g:description'].length <= 5000)
		assert.equal(item['g:link'], data.url)
		assert.equal(item['g:image_link'], data.image[0])
		assert.deepEqual(item['g:additional_image_link'], Array.from(data.image.slice(1)))
		assert.equal(item['g:price'], `${expectedGross[product.id]} EUR`)
		assert.equal(item['g:price'], `${data.offers.price} ${data.offers.priceCurrency}`)
		assert.equal(item['g:availability'], 'in_stock')
		assert.equal(item['g:condition'], 'new')
		assert.equal(item['g:brand'], data.brand.name)
		assert.equal(item['g:google_product_category'], product.googleProductCategory)
		assert.equal(item['g:shipping_weight'], `${product.weightGrams} g`)
		// Shipping and free-shipping thresholds must be configured at account level.
		assert.equal(item['g:shipping'], undefined)
		for (const quantity of [1, 3]) {
			const quote = calculateQuote({ items: [{ id: product.id, quantity }] }, 'DE')
			assert.equal(quote.subtotalCents + quote.productVatCents, Math.round(Number(expectedGross[product.id]) * 100) * quantity)
		}
		for (const image of [item['g:image_link'], ...item['g:additional_image_link']]) {
			const url = new URL(image)
			assert.equal(url.origin, SITE_URL)
			const file = statSync(path.join(root, 'public', url.pathname))
			assert.ok(file.isFile())
			assert.ok(file.size > 0 && file.size <= 8 * 1024 * 1024)
		}
	})
}

test('XML serialization preserves special characters and cannot inject products or elements', () => {
	const title = 'IND <test> & "quoted" \'sample\' \u00df'
	const description = '</g:description><item>injected</item> & \u00e4 ]]>\nsecond line'
	const copy = structuredClone(translations)
	copy.products.products.nails = title
	copy.products.description.nails = description
	const { productFeedXml: serialize } = loadModule('src/lib/product-feed.ts', {
		'@/app/i18n/locales/de/translations.json': copy,
	})
	const items = parseFeed(serialize()).rss.channel.item
	assert.equal(items.length, 6)
	assert.equal(items[0]['g:title'], title)
	assert.equal(items[0]['g:description'], description)
	assert.equal(items[0].item, undefined)
})

test('feed availability and JSON-LD share the product stock flag', () => {
	const product = { ...products[0], inStock: false }
	const { productFeedXml: serialize } = loadModule('src/lib/product-feed.ts', {
		'@/src/data/products': { products: [product], PRODUCT_BRAND },
	})
	assert.equal(parseFeed(serialize()).rss.channel.item['g:availability'], 'out_of_stock')
	assert.equal(productStructuredData(product, 'de', 'Test', 'Test').offers.availability, 'https://schema.org/OutOfStock')
})

test('the public route returns XML with a fixed language, no secrets and bounded caching', async () => {
	const route = loadModule('app/feeds/products.xml/route.ts')
	assert.equal(route.dynamic, 'force-static')
	assert.equal(route.revalidate, 3600)
	const response = route.GET()
	assert.equal(response.status, 200)
	assert.equal(response.headers.get('content-type'), 'application/xml; charset=utf-8')
	assert.equal(response.headers.get('content-language'), 'de-DE')
	assert.equal(response.headers.get('x-robots-tag'), 'noindex')
	assert.equal(response.headers.get('location'), null)
	assert.equal(response.headers.get('set-cookie'), null)
	assert.equal(await response.text(), productFeedXml())
})
