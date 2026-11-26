import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../src/components/ui/FaqAccordeon.tsx', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText
const exports = {}
vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, {})(require, exports)
const Accordion = exports.default

for (const lng of ['pl', 'de', 'en']) {
	const copy = JSON.parse(readFileSync(new URL(`../app/i18n/locales/${lng}/translations.json`, import.meta.url), 'utf8'))
	test(`product feature lists keep their indentation inside the panel width in ${lng}`, () => {
		for (const product of ['nails', 'magnetic', 'transparent', 'frame', 'cabinet', 'display']) {
			const html = renderToStaticMarkup(createElement(Accordion, {
				title: copy.products.features.title,
				list: copy.products.features[product],
			}))
			const classes = html.match(/<ul class="([^"]+)"/)[1].split(/\s+/)
			assert.ok(classes.includes('pl-6'))
			assert.ok(!classes.includes('ml-6'))
			assert.ok(classes.includes('w-full'))
			assert.ok(html.includes('aria-expanded="true"'))
			for (const text of copy.products.features[product]) {
				assert.ok(html.includes(renderToStaticMarkup(text)))
			}
		}
	})
}
