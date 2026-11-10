import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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

function renderNavigation(component, lng, pathname) {
	const translations = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
	const filename = path.join(root, `src/components/nav/${component}.tsx`)
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
		if (name === 'next/navigation') return { usePathname: () => pathname }
		if (name === 'next/link') return { default: 'a' }
		if (['../ui/LogoLink', './LanguageSwitcher', '../ui/BasketButton', '../ui/LinkButton'].includes(name)) return { default: () => null }
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, {}, { filename })(localRequire, exports)
	return renderToStaticMarkup(createElement(exports.default, { lng, isExpanded: true, isSocialOpen: false, toggleIsSocialOpen() {} }))
}

for (const [lng, label] of [['pl', 'Regulamin'], ['en', 'Terms &amp; Conditions'], ['de', 'AGB']]) {
	for (const component of ['DesktopNav', 'NavList']) {
		test(`${component} links localized terms to /${lng}/agb and highlights only the terms route`, () => {
			const html = renderNavigation(component, lng, `/${lng}/agb`)
			assert.ok(html.includes(`href="/${lng}/agb" aria-current="page"`))
			assert.ok(html.includes(`>${label}</a>`))
			assert.ok(!html.includes(`href="/${lng}/datenschutz"`))
			const privacyHtml = renderNavigation(component, lng, `/${lng}/datenschutz`)
			assert.ok(!privacyHtml.includes('aria-current="page"'))
		})
	}
}
