import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))

function loadModule(relativePath, translations) {
	const filename = path.join(root, relativePath)
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
	}).outputText
	const exports = {}
	const localRequire = name => {
		if (name === '@/app/i18n') return {
			getT: async () => ({ t: (key, options) => {
				const value = key.split('.').reduce((copy, part) => copy?.[part], translations)
				if (options?.returnObjects) assert.ok(Array.isArray(value))
				else assert.equal(typeof value, 'string', `Missing translation: ${key}`)
				return typeof value === 'string' && options?.weight !== undefined ? value.replace('{{weight}}', String(options.weight)) : value
			} }),
		}
		if (name.startsWith('@/')) return loadModule(`${name.slice(2)}${name.endsWith('/Pill') ? '.tsx' : '.ts'}`, translations)
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, { URL }, { filename })(localRequire, exports)
	return exports
}

const german = JSON.parse(readFileSync(path.join(root, 'app/i18n/locales/de/translations.json'), 'utf8')).shippingPayment
const markup = value => renderToStaticMarkup(value)
const countries = new Map([[1, 'DE'], [2, 'PL'], [3, 'CH'], [4, 'NO'], [5, 'AE']])

for (const lng of ['de', 'en', 'pl']) {
	test('shipping page renders all sections, accessible tables and checkout-matched prices in ' + lng, async () => {
		const translations = JSON.parse(readFileSync(path.join(root, 'app/i18n/locales/' + lng + '/translations.json'), 'utf8'))
		const copy = translations.shippingPayment
		const page = loadModule('app/[lng]/versand-zahlung/page.tsx', translations)
		const { company } = loadModule('src/data/company.ts', translations)
		const { products } = loadModule('src/data/products.ts', translations)
		const { calculateQuote } = loadModule('src/lib/checkout.ts', translations)
		const params = Promise.resolve({ lng })
		const html = markup(await page.default({ params }))
		assert.equal(copy.sections.length, 13)
		assert.equal((html.match(/<h1\b/g) || []).length, 1)
		assert.equal((html.match(/<h2 class="text-\[32px\] leading-10"/g) || []).length, 13)
		assert.equal((html.match(/<h3 class="text-xl leading-8 pt-10"/g) || []).length, 1)
		assert.equal((html.match(/<table\b/g) || []).length, 5)
		assert.equal((html.match(/<caption class="sr-only"/g) || []).length, 5)
		assert.equal((html.match(/scope="col"/g) || []).length, 10)
		assert.equal((html.match(/scope="row"/g) || []).length, 21)
		assert.doesNotMatch(JSON.stringify(copy), /\[(?:ZU |DO |TO BE )/)
		for (const [index, section] of copy.sections.entries()) {
			assert.ok(section.title.startsWith((index + 1) + '. '))
			assert.ok(html.includes(markup(section.title)))
			assert.deepEqual(section.blocks.map(block => block.type), german.sections[index].blocks.map(block => block.type))
			for (const block of section.blocks) {
				if (block.text) {
					if (Array.isArray(block.text)) {
						for (const part of block.text) {
							assert.ok(html.includes(typeof part === 'string' ? markup(part) : '<strong>' + markup(part.strong) + '</strong>'))
						}
					} else assert.ok(html.includes(markup(block.text)))
				}
				if (block.type === 'rates') {
					assert.deepEqual(block.rows, german.sections[index].blocks.find(item => item.type === 'rates').rows)
					for (const row of block.rows) {
						const quantity = index === 1 ? 1 : Math.floor(row.weight * 1000 / products[0].weightGrams)
						const cart = { items: [{ id: products[0].id, quantity }] }
						assert.equal(calculateQuote(cart, countries.get(index)).shippingCents, row.cents)
						if (index === 2) assert.equal(calculateQuote(cart, 'MC').shippingCents, row.cents)
						if (index === 5) assert.equal(calculateQuote(cart, 'QA').shippingCents, row.cents)
						assert.ok(html.includes(markup(new Intl.NumberFormat(lng, { style: 'currency', currency: 'EUR' }).format(row.cents / 100))))
						assert.ok(html.includes(copy.upTo.replace('{{weight}}', String(row.weight))))
					}
				}
				if (block.type === 'list') for (const item of block.items) assert.ok(html.includes(markup(item)))
				if (block.bold) assert.ok(html.includes('<strong>' + markup(block.text) + '</strong>'))
				if (block.italic) assert.ok(html.includes('<em>' + markup(block.text) + '</em>'))
			}
		}
		for (const value of [company.owner, company.street, company.postalCode, company.city, company.email]) assert.ok(html.includes(value))
		for (const href of [company.phoneHref, 'mailto:' + company.email]) assert.ok(html.includes('href="' + href + '"'))
		const metadata = await page.generateMetadata({ params }, Promise.resolve({}))
		assert.equal(metadata.alternates.canonical, 'https://www.iwonnaildisplay.de/' + lng + '/versand-zahlung')
		for (const language of ['de', 'en', 'pl']) {
			assert.equal(metadata.alternates.languages[language], 'https://www.iwonnaildisplay.de/' + language + '/versand-zahlung')
		}
	})
}
