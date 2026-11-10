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

const { createWithdrawalFormSchema } = loadModule('src/lib/withdrawal-form.ts', {})
const valid = { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', orderNumber: 'IND-1234567890', scope: 'all', terms: true }

for (const lng of ['de', 'en', 'pl']) {
	const translations = JSON.parse(readFileSync(path.join(root, 'app/i18n/locales/' + lng + '/translations.json'), 'utf8'))
	const t = key => key.split('.').reduce((copy, part) => copy[part], translations)
	const schema = createWithdrawalFormSchema(t)

	test('withdrawal validation accepts both scopes, international names and order formats in ' + lng, () => {
		for (const scope of ['all', 'selected']) {
			for (const orderNumber of ['IND-1234567890', '1234567890', 'IND-0000000001']) {
				assert.equal(schema.safeParse({ ...valid, scope, orderNumber, ...(scope === 'selected' ? { returnedProducts: 'IND Nails, 1 pack' } : {}) }).success, true)
			}
		}
		for (const name of ['Łukasz', 'Anna Maria', 'Anne-Marie', "O'Neill", '李', 'A']) {
			assert.equal(schema.safeParse({ ...valid, firstName: name, lastName: name }).success, true)
		}
		const parsed = schema.parse({ ...valid, firstName: ' Anna ', lastName: ' Kowalska ', email: ' anna@example.com ', orderNumber: ' ind-1234567890 ' })
		assert.equal(parsed.firstName, 'Anna')
		assert.equal(parsed.lastName, 'Kowalska')
		assert.equal(parsed.email, 'anna@example.com')
		assert.equal(parsed.orderNumber, 'IND-1234567890')
	})

	for (const [field, value] of [
		['firstName', ''], ['firstName', '   '], ['lastName', ''], ['lastName', '   '],
		['firstName', '123'], ['lastName', '<script>'], ['firstName', 'a'.repeat(101)], ['lastName', 'a'.repeat(101)],
		['email', ''], ['email', 'not-an-email'], ['email', 'a'.repeat(250) + '@test.com'],
		['orderNumber', ''], ['orderNumber', '123456789'], ['orderNumber', '12345678901'],
		['orderNumber', 'IND-12345abcde'], ['orderNumber', 'ABC-1234567890'], ['orderNumber', '1e12345678'],
		['scope', ''], ['scope', 'unknown'], ['terms', false],
	]) {
		test('withdrawal validation rejects ' + field + '=' + JSON.stringify(value) + ' in ' + lng, () => {
			const result = schema.safeParse({ ...valid, [field]: value })
			assert.equal(result.success, false)
			const issue = result.error.issues.find(item => item.path[0] === field)
			assert.ok(issue)
			assert.ok(Object.values(translations.withdrawalForm.validation).includes(issue.message))
		})
	}

	for (const returnedProducts of [undefined, '', '   ', 'a'.repeat(2001)]) {
		test('withdrawal validation requires a non-empty product description within the limit for selected items in ' + lng + ': ' + String(returnedProducts?.length), () => {
			const result = schema.safeParse({ ...valid, scope: 'selected', returnedProducts })
			assert.equal(result.success, false)
			assert.ok(result.error.issues.some(issue => issue.path[0] === 'returnedProducts'))
			assert.equal(schema.safeParse({ ...valid, scope: 'all', returnedProducts }).success, true)
		})
	}

	test('withdrawal validation trims the product description for selected items in ' + lng, () => {
		const result = schema.parse({ ...valid, scope: 'selected', returnedProducts: '  IND Nails, 1 pack  ' })
		assert.equal(result.returnedProducts, 'IND Nails, 1 pack')
	})

	test('withdrawal validation rejects missing consent and scope in ' + lng, () => {
		const { terms, scope, ...withoutRequired } = valid
		void terms
		void scope
		assert.equal(schema.safeParse(withoutRequired).success, false)
	})
}
