import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
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

function loadModule(relativePath, lng, products) {
	const filename = path.resolve(root, relativePath)
	const copy = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
	}).outputText
	const exports = {}
	const localRequire = name => {
		if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) }
		if (name === '@/app/i18n/client') return { useT: () => ({ t: (key, options) => {
			const value = key.split('.').reduce((value, part) => value?.[part], copy)
			assert.equal(typeof value, 'string', key)
			return value.replace('{{discount}}', String(options?.discount))
		} }) }
		if (name === '@/src/data/products' && products) return { products }
		if (name === 'next/navigation') return { usePathname: () => `/${lng}` }
		if (name === 'next/link') return { __esModule: true, default: 'a' }
		if (['../ui/LogoLink', './DesktopNav', './LanguageSwitcher', '../ui/BasketButton', './NavList'].includes(name)) {
			return { __esModule: true, default: () => null }
		}
		if (name.startsWith('@/') || name.startsWith('.')) {
			const target = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name)
			return loadModule(target + (existsSync(target + '.tsx') ? '.tsx' : '.ts'), lng, products)
		}
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, {}, { filename })(localRequire, exports)
	return exports
}

for (const [lng, message, link] of [
	['pl', 'Świąteczne promocje do −50%', 'Zobacz produkty'],
	['de', 'Weihnachtsangebote bis −50%', 'Produkte entdecken'],
	['en', 'Christmas offers up to −50%', 'Shop products'],
]) {
	test(`Christmas strip has a localized product link and decorative artwork in ${lng}`, () => {
		const { default: Promotion } = loadModule('src/components/nav/ChristmasPromotion.tsx', lng)
		const html = renderToStaticMarkup(createElement(Promotion, { lng, discount: 50 }))
		assert.ok(html.includes(message))
		assert.ok(html.includes(`href="/${lng}/produkte"`))
		assert.ok(html.includes(link))
		assert.ok(html.includes('aria-hidden="true"'))
		assert.ok(!/<button|<dialog|role="timer"|role="alert"/.test(html))
	})

	test(`navigation derives the advertised maximum from product discounts and hides the strip without offers in ${lng}`, () => {
		for (const [products, discount] of [
			[[{ discount: 30 }, { discount: 50 }], 50],
			[[{ discount: 15 }, { discount: 30 }], 30],
			[[{}, { discount: 0 }], 0],
		]) {
			const { default: Navbar } = loadModule('src/components/nav/Navbar.tsx', lng, products)
			const html = renderToStaticMarkup(createElement(Navbar, { lng }))
			assert.equal(html.includes('christmas-promotion'), discount > 0)
			if (discount) assert.ok(html.includes(`−${discount}%`))
		}
	})
}

test('Christmas decoration is a small local WebP asset', () => {
	const asset = statSync(path.join(root, 'public/assets/christmas-decoration.webp'))
	assert.ok(asset.size > 0 && asset.size < 64 * 1024)
})
