import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))

function loadModule(relativePath) {
	const filename = path.join(root, relativePath)
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	}).outputText
	const exports = {}
	const localRequire = name => name.startsWith('@/') ? loadModule(`${name.slice(2)}.ts`) : require(name)
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, { URL }, { filename })(localRequire, exports)
	return exports
}

const { homepageStructuredData, productStructuredData, serializeJsonLd } = loadModule('src/lib/structured-data.ts')
const { company } = loadModule('src/data/company.ts')
const { products } = loadModule('src/data/products.ts')
const { SITE_URL } = loadModule('src/lib/seo.ts')

test('organization reuses company contact details and website references the same organization', () => {
	const [organization, website] = homepageStructuredData['@graph']
	assert.equal(organization.name, company.name)
	assert.equal(organization.email, company.email)
	assert.equal(organization.telephone, company.phoneHref.replace('tel:', ''))
	assert.equal(organization.vatID, company.vatId)
	assert.equal(organization.address.streetAddress, company.street)
	assert.equal(organization.address.postalCode, company.postalCode)
	assert.equal(organization.address.addressLocality, company.city)
	assert.equal(organization.address.addressCountry, 'DE')
	assert.equal(website.publisher['@id'], organization['@id'])
	assert.equal(website.url, `${SITE_URL}/`)
})

for (const lng of ['de', 'en', 'pl']) {
	test(`product data matches catalog images and visible translations in ${lng}, without guessing gross prices or stock`, () => {
		const translations = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
		for (const product of products) {
			const name = translations.products.products[product.name]
			const description = translations.products.description[product.name]
			const data = productStructuredData(product, lng, name, description)
			assert.equal(data.name, name)
			assert.equal(data.description, description)
			assert.equal(data.url, `${SITE_URL}/${lng}/produkte/${product.slug}`)
			assert.equal(data['@id'], `${data.url}#product`)
			assert.equal(data.image.length, product.images.length)
			for (const [index, image] of data.image.entries()) assert.equal(image, `${SITE_URL}${product.images[index]}`)
			assert.equal(data.offers, undefined)
			assert.equal(data.aggregateRating, undefined)
		}
	})
}

test('JSON-LD cannot close the script element and preserves translated text', () => {
	const data = { name: 'Zażółć <test>', description: '</script><script>alert(1)</script>' }
	const serialized = serializeJsonLd(data)
	assert.ok(!serialized.includes('<'))
	assert.deepEqual(JSON.parse(serialized), data)
})
