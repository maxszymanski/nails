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

function loadModule(relativePath, translations) {
	const filename = path.join(root, relativePath)
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
	}).outputText
	const exports = {}
	const localRequire = name => {
		if (name === '@/src/components/ui/ComplaintForm') return { default: () => null }
		if (name === '@/app/i18n') return {
			getT: async () => ({ t: (key, options) => {
				const value = key.split('.').reduce((copy, part) => copy?.[part], translations)
				if (options?.returnObjects) assert.ok(Array.isArray(value))
				else assert.equal(typeof value, 'string', `Missing translation: ${key}`)
				return value
			} }),
		}
		if (name.startsWith('@/')) return loadModule(`${name.slice(2)}${name.endsWith('/Pill') ? '.tsx' : '.ts'}`, translations)
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, { URL }, { filename })(localRequire, exports)
	return exports
}

const { createComplaintFormSchema, COMPLAINT_PROBLEMS, COMPLAINT_RESOLUTIONS } = loadModule('src/lib/complaint-form.ts', {})
const { products } = loadModule('src/data/products.ts', {})
const valid = { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', orderNumber: 'IND-1234567890', product: 'nails', problem: 'damaged', description: 'The product arrived damaged.', resolution: 'replacement', terms: true }

for (const lng of ['de', 'en', 'pl']) {
	const translations = JSON.parse(readFileSync(path.join(root, 'app/i18n/locales/' + lng + '/translations.json'), 'utf8'))
	const t = key => key.split('.').reduce((copy, part) => copy[part], translations)
	const schema = createComplaintFormSchema(t)

	test('complaint form accepts all six products, four problems and three solutions in ' + lng, () => {
		assert.equal(products.length, 6)
		assert.equal(COMPLAINT_PROBLEMS.length, 4)
		assert.equal(COMPLAINT_RESOLUTIONS.length, 3)
		for (const product of products) for (const problem of COMPLAINT_PROBLEMS) for (const resolution of COMPLAINT_RESOLUTIONS) {
			assert.equal(schema.safeParse({ ...valid, product: product.name, problem, resolution }).success, true)
			assert.equal(typeof translations.products.products[product.name], 'string')
			assert.equal(typeof translations.complaintForm.problems[problem], 'string')
			assert.equal(typeof translations.complaintForm.resolutions[resolution], 'string')
		}
		for (const orderNumber of ['IND-1234567890', '1234567890', 'IND-0000000001']) {
			assert.equal(schema.safeParse({ ...valid, orderNumber }).success, true)
		}
		for (const name of ['Łukasz', 'Anne-Marie', "O'Neill", '李', 'A']) {
			assert.equal(schema.safeParse({ ...valid, firstName: name, lastName: name }).success, true)
		}
		const parsed = schema.parse({ ...valid, firstName: ' Anna ', lastName: ' Kowalska ', email: ' anna@example.com ', orderNumber: ' ind-1234567890 ', description: ' Damaged item. ' })
		assert.equal(parsed.firstName, 'Anna')
		assert.equal(parsed.lastName, 'Kowalska')
		assert.equal(parsed.email, 'anna@example.com')
		assert.equal(parsed.orderNumber, 'IND-1234567890')
		assert.equal(parsed.description, 'Damaged item.')
	})

	for (const [field, value] of [
		['firstName', ''], ['firstName', '   '], ['firstName', '123'], ['firstName', 'a'.repeat(101)],
		['lastName', ''], ['lastName', '   '], ['lastName', '<script>'], ['lastName', 'a'.repeat(101)],
		['email', ''], ['email', 'not-an-email'], ['email', 'a'.repeat(250) + '@test.com'],
		['orderNumber', ''], ['orderNumber', '   '], ['orderNumber', '123456789'], ['orderNumber', '12345678901'],
		['orderNumber', 'IND-12345abcde'], ['orderNumber', 'ABC-1234567890'],
		['product', ''], ['product', 'unknown'], ['problem', ''], ['problem', 'unknown'],
		['description', ''], ['description', '   '], ['description', 'a'.repeat(5001)],
		['resolution', ''], ['resolution', 'unknown'], ['terms', false],
	]) {
		test('complaint form rejects invalid ' + field + ' (' + String(value).length + ' characters) in ' + lng, () => {
			const result = schema.safeParse({ ...valid, [field]: value })
			assert.equal(result.success, false)
			const issue = result.error.issues.find(item => item.path[0] === field)
			assert.ok(issue)
			assert.ok(Object.values(translations.complaintForm.validation).includes(issue.message))
		})
	}

	test('complaint form requires every field, including the order number, in ' + lng, () => {
		for (const field of Object.keys(valid)) {
			const data = { ...valid }
			delete data[field]
			assert.equal(schema.safeParse(data).success, false, field)
		}
	})

	test('complaint form metadata has the localized canonical and stays noindex in ' + lng, async () => {
		const page = loadModule('app/[lng]/reklamation/formular/page.tsx', translations)
		const metadata = await page.generateMetadata({ params: Promise.resolve({ lng }) }, Promise.resolve({}))
		assert.equal(metadata.alternates.canonical, 'https://www.iwonnaildisplay.de/' + lng + '/reklamation/formular')
		assert.equal(metadata.robots.index, false)
		assert.equal(metadata.robots.follow, true)
		for (const language of ['de', 'en', 'pl']) {
			assert.equal(metadata.alternates.languages[language], 'https://www.iwonnaildisplay.de/' + language + '/reklamation/formular')
		}
	})
}
