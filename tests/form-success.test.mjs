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

function loadModule(relativePath, translations) {
	const filename = path.join(root, relativePath)
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
	}).outputText
	const exports = {}
	const localRequire = name => {
		if (name === '@/app/i18n/client') return { useT: () => ({ t: key => {
			const value = key.split('.').reduce((copy, part) => copy?.[part], translations)
			assert.equal(typeof value, 'string', key)
			return value
		} }) }
		if (name === 'react-dom') return { ...require(name), createPortal: children => children }
		if (name.startsWith('@/') || name.startsWith('.')) {
			const target = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name)
			const extension = existsSync(target + '.tsx') ? '.tsx' : '.ts'
			return loadModule(path.relative(root, target + extension), translations)
		}
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, { document: { body: {} } }, { filename })(localRequire, exports)
	return exports
}

for (const lng of ['de', 'en', 'pl']) {
	const translations = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
	for (const [kind, prefix] of [['withdrawal', 'withdrawalForm'], ['complaint', 'complaintForm']]) {
		test(`centered ${kind} confirmation contains localized title, description and close button in ${lng}`, () => {
			const Modal = loadModule('src/components/ui/FormSuccessModal.tsx', translations).default
			const html = renderToStaticMarkup(createElement(Modal, { kind, onClose() {} }))
			assert.ok(html.includes('role="dialog"'))
			assert.ok(html.includes('aria-modal="true"'))
			assert.ok(html.includes('aria-labelledby='))
			assert.ok(html.includes('aria-describedby='))
			assert.ok(html.includes('items-center justify-center p-4'))
			assert.ok(html.includes('max-w-[440px]'))
			assert.ok(html.includes(translations[prefix].success.title))
			assert.ok(html.includes(translations[prefix].success.message))
			assert.ok(html.includes(translations.formConfirmation.close))
			assert.ok(html.includes('type="button"'))
		})
	}
}

test('existing cart modal placement remains right-aligned by default', () => {
	const Modal = loadModule('src/components/ui/Modal.tsx', {}).default
	const html = renderToStaticMarkup(createElement(Modal, { labelledBy: 'cart-title' }, createElement('h2', { id: 'cart-title' }, 'Cart')))
	assert.ok(html.includes('justify-end'))
	assert.ok(!html.includes('items-center justify-center'))
})
