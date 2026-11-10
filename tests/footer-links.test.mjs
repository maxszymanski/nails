import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { Children, isValidElement } from 'react'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))

function loadFooter(translations) {
	const filename = path.join(root, 'src/components/footer/FooterNav.tsx')
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
	}).outputText
	const exports = {}
	const localRequire = name => {
		if (name === '@/app/i18n') return { getT: async () => ({ t: key => {
			const value = key.split('.').reduce((copy, part) => copy?.[part], translations)
			assert.equal(typeof value, 'string', key)
			return value
		} }) }
		if (name === '../ui/LinkButton') return { default: 'a' }
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, {}, { filename })(localRequire, exports)
	return exports.default
}

for (const lng of ['de', 'en', 'pl']) {
	test(`footer lists localized form links after FAQ and emphasizes only withdrawal in ${lng}`, async () => {
		const translations = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
		const tree = await loadFooter(translations)({ lng })
		const links = []
		const items = []
		function visit(node) {
			if (!isValidElement(node)) return
			if (node.props.href) links.push(node.props)
			if (node.type === 'li') items.push(node)
			Children.forEach(node.props.children, visit)
		}
		visit(tree)
		const [faq, withdrawal, complaint] = links.slice(-3)
		assert.equal(faq.href, `/${lng}/faq`)
		assert.equal(withdrawal.href, `/${lng}/widerruf/formular`)
		assert.equal(complaint.href, `/${lng}/reklamation/formular`)
		assert.equal(withdrawal.children, translations.footer.legal.withdrawalForm)
		assert.equal(complaint.children, translations.footer.legal.complaintForm)
		assert.equal(withdrawal.variant, 'footer')
		assert.equal(complaint.variant, 'footer')
		assert.match(withdrawal.restClass, /\bfont-bold\b/)
		assert.match(withdrawal.restClass, /\bunderline\b/)
		assert.doesNotMatch(complaint.restClass, /font-bold|underline/)
		assert.equal(withdrawal.style.textWrap, 'wrap')
		assert.equal(complaint.style.textWrap, 'wrap')
		assert.equal(items.at(-2).props.className, 'mt-2 max-w-full')
		assert.equal(links.filter(link => link.href === withdrawal.href).length, 1)
		assert.equal(links.filter(link => link.href === complaint.href).length, 1)
	})
}
