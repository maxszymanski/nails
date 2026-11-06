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
				return value
			} }),
		}
		if (name.startsWith('@/')) return loadModule(`${name.slice(2)}${name.endsWith('/Pill') ? '.tsx' : '.ts'}`, translations)
		return require(name)
	}
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, { URL }, { filename })(localRequire, exports)
	return exports
}

const german = JSON.parse(readFileSync(path.join(root, 'app/i18n/locales/de/translations.json'), 'utf8')).withdrawal
const markup = value => renderToStaticMarkup(value)

for (const lng of ['de', 'en', 'pl']) {
	test(`withdrawal notice renders all content, model form and temporary localized homepage link in ${lng}`, async () => {
		const translations = JSON.parse(readFileSync(path.join(root, `app/i18n/locales/${lng}/translations.json`), 'utf8'))
		const copy = translations.withdrawal
		const page = loadModule('app/[lng]/widerruf/page.tsx', translations)
		const { company } = loadModule('src/data/company.ts', translations)
		const params = Promise.resolve({ lng })
		const html = markup(await page.default({ params }))
		assert.equal(copy.sections.length, 6)
		assert.equal((html.match(/<h1\b/g) || []).length, 1)
		assert.equal((html.match(/<h2 class="text-\[32px\] leading-10"/g) || []).length, 6)
		assert.equal((html.match(/<h3 class="text-xl leading-8 pt-10"/g) || []).length, 2)
		assert.ok(!html.includes('<form'))
		assert.ok(!html.includes('<input'))
		assert.doesNotMatch(JSON.stringify(copy), /\[(?:ZU |DO |TO BE |LINK |DIESER )/)
		assert.doesNotMatch(copy.updated, /Entwurf|Draft|Projekt/)
		for (const [index, section] of copy.sections.entries()) {
			assert.ok(section.title.startsWith(`${index + 1}. `))
			assert.ok(html.includes(markup(section.title)))
			assert.deepEqual(section.blocks.map(block => block.type), german.sections[index].blocks.map(block => block.type))
			for (const block of section.blocks) {
				if (block.text) assert.ok(html.includes(markup(block.text)))
				if (block.type === 'form') {
					assert.equal(block.fields.length, 6)
					for (const field of block.fields) assert.ok(html.includes(`<strong>${markup(field)}</strong>`))
				}
				if (block.type === 'withdrawalLink') {
					assert.ok(html.includes(`href="/${lng}"`))
				}
				if (block.bold) assert.ok(html.includes(`<strong>${markup(block.text)}</strong>`))
			}
		}
		for (const value of [company.owner, company.street, company.postalCode, company.city, company.email]) assert.ok(html.includes(value))
		for (const href of [company.phoneHref, `mailto:${company.email}`]) assert.ok(html.includes(`href="${href}"`))
		const metadata = await page.generateMetadata({ params }, Promise.resolve({}))
		assert.equal(metadata.alternates.canonical, `https://www.iwonnaildisplay.de/${lng}/widerruf`)
		for (const language of ['de', 'en', 'pl']) {
			assert.equal(metadata.alternates.languages[language], `https://www.iwonnaildisplay.de/${language}/widerruf`)
		}
	})
}
