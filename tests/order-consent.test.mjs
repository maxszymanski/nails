import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import i18next from 'i18next'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))

async function renderOrderForm(lng, isSubmitting = false) {
	const translations = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
	const i18n = i18next.createInstance()
	await i18n.init({ lng, fallbackLng: false, defaultNS: 'translations', resources: { [lng]: { translations } } })
	let resolver
	function loadModule(relativePath) {
		const filename = path.join(root, relativePath)
		const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
		}).outputText
		const exports = {}
		const localRequire = name => {
			if (name === '@/app/i18n/client') return { useT: () => ({ t: i18n.getFixedT(lng, 'translations'), i18n }) }
			if (name === 'next/navigation') return { usePathname: () => `/${lng}/produkte/fingernagel` }
			if (name === 'next/link') return { __esModule: true, default: 'a' }
			if (name === '../stores/CartStore') return { useCartStore: selector => selector({ clearCart() {} }) }
			if (name === 'react-hook-form') return { ...require(name), useForm: options => {
				resolver = options.resolver
				return require(name).useForm(options)
			} }
			if (name.startsWith('@/') || name.startsWith('.')) {
				const target = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name)
				return loadModule(path.relative(root, target + (existsSync(target + '.tsx') ? '.tsx' : '.ts')))
			}
			return require(name)
		}
		vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, {}, { filename })(localRequire, exports)
		return exports
	}
	const OrderForm = loadModule('src/components/ui/OrderForm.tsx').default
	const html = renderToStaticMarkup(createElement(OrderForm, {
		cartInformation: { items: [{ id: 0, quantity: 1 }] }, isSubmitting, setIsSubmitting() {}, setStep() {},
	}))
	return { html, translations, resolver }
}

for (const lng of ['pl', 'en', 'de']) {
	test(`order consent links all three localized documents and remains required in ${lng}`, async () => {
		const { html, translations } = await renderOrderForm(lng)
		assert.equal(typeof translations.cart.orderConsent, 'string')
		const label = html.match(/<label[^>]*for="terms"[^>]*>(.*?)<\/label>/s)?.[1]
		assert.ok(label)
		assert.match(label, /type="checkbox"[^>]*required=""/)
		assert.doesNotMatch(label, /checked=""/)
		const links = Array.from(label.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs))
		assert.equal(links.length, 3)
		for (const [index, route] of ['agb', 'datenschutz', 'versand-zahlung'].entries()) {
			assert.ok(links[index][1].includes(`href="/${lng}/${route}"`))
			assert.ok(links[index][1].includes('target="_blank"'))
			assert.ok(links[index][1].includes('rel="noopener noreferrer"'))
			assert.ok(links[index][2].length > 0)
		}
		const submitting = await renderOrderForm(lng, true)
		assert.match(submitting.html, /id="terms"[^>]*disabled=""/)
	})

	test(`order consent validation rejects missing acceptance with the localized message in ${lng}`, async () => {
		const { resolver, translations } = await renderOrderForm(lng)
		const values = {
			country: 'DE', isBusiness: false, companyName: '', vatId: '', firstName: 'Anna', lastName: 'Testowa',
			address: 'Teststrasse 12', zipCode: '40699', city: 'Erkrath', email: 'qa@example.invalid', terms: false,
		}
		const options = { criteriaMode: 'firstError', fields: {}, shouldUseNativeValidation: false }
		const invalid = await resolver(values, undefined, options)
		assert.equal(invalid.errors.terms.message, translations.validation.termsRequired)
		const valid = await resolver({ ...values, terms: true }, undefined, options)
		assert.deepEqual(valid.errors, {})
	})
}
