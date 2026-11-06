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
			getT: async () => ({ t: key => {
				const value = key.split('.').reduce((copy, part) => copy?.[part], translations)
				assert.equal(typeof value, 'string', `Missing translation: ${key}`)
				return value
			} }),
		}
		if (name.startsWith('@/')) return loadModule(`${name.slice(2)}${name.endsWith('/Pill') ? '.tsx' : '.ts'}`, translations)
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, { URL }, { filename })(localRequire, exports)
	return exports
}

for (const lng of ['de', 'en', 'pl']) {
	test(`impressum renders translated content and company details in ${lng}`, async () => {
		const translations = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
		const page = loadModule('app/[lng]/impressum/page.tsx', translations)
		const { company } = loadModule('src/data/company.ts', translations)
		const html = renderToStaticMarkup(await page.default())
		assert.equal((html.match(/<h1\b/g) || []).length, 1)
		assert.equal((html.match(/<h2\b/g) || []).length, 4)
		const privacySource = readFileSync(path.join(root, 'app/[lng]/datenschutz/page.tsx'), 'utf8')
		for (const tag of ['h1', 'h2']) {
			const headingClass = privacySource.match(new RegExp(`<${tag} className="([^"]+)"`))[1]
			for (const heading of html.matchAll(new RegExp(`<${tag} class="([^"]+)"`, 'g'))) {
				assert.equal(heading[1], headingClass)
			}
		}
		assert.ok(html.includes(`<p class="text-grayscale-500 leading-6 ">${translations.impressum.subtitle}</p>`))
		for (const value of [translations.impressum.title, translations.impressum.disputeDescription, company.owner, company.street, company.vatId]) {
			assert.ok(html.includes(value))
		}
		assert.ok(html.includes(`href="mailto:${company.email}"`))
		assert.ok(html.includes(`href="${company.phoneHref}"`))
		assert.ok(html.includes('href="https://www.iwonnaildisplay.de/"'))
		assert.ok(!html.includes('privacy.'))
		const metadata = await page.generateMetadata({ params: Promise.resolve({ lng }) }, Promise.resolve({}))
		assert.equal(metadata.alternates.canonical, `https://www.iwonnaildisplay.de/${lng}/impressum`)
		for (const language of ['de', 'en', 'pl']) {
			assert.equal(metadata.alternates.languages[language], `https://www.iwonnaildisplay.de/${language}/impressum`)
		}
	})
}
