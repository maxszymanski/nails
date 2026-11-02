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
const { NextRequest } = require('next/server')

function loadModule(relativePath) {
	const filename = path.join(root, relativePath)
	const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
	}).outputText
	const exports = {}
	const localRequire = name => name.startsWith('./') ? loadModule(`${name.slice(2)}.ts`) : require(name)
	vm.runInNewContext(`(function(require, exports) { ${compiled}\n })`, { Headers, URL, process }, { filename })(localRequire, exports)
	return exports
}

const { proxy } = loadModule('proxy.ts')
const request = (pathname, headers = {}) => new NextRequest(`https://www.iwonnaildisplay.de${pathname}`, { headers })

for (const lng of ['pl', 'en', 'de']) {
	test(`preserves ${lng} pages and language headers`, () => {
		for (const suffix of ['', '/produkte', '/produkte/fingernagel', '/faq', '/datenschutzerklarung']) {
			const response = proxy(request(`/${lng}${suffix}`, { cookie: 'i18next=de', 'accept-language': 'de' }))
			assert.equal(response.status, 200)
			assert.equal(response.headers.get('location'), null)
			assert.equal(response.headers.get('x-i18next-current-language'), lng)
		}
	})
}

for (const pathname of ['/plx', '/plx/produkte', '/english', '/deutsch/produkte', '/fr', '/fr/produkte', '/pl-PL', '/PL', '/plx/icon', '/fr/chrome']) {
	test(`rejects unsupported language path ${pathname} without canonical or redirect`, async () => {
		const response = proxy(request(pathname, { 'accept-language': 'pl', cookie: 'i18next=en' }))
		assert.equal(response.status, 404)
		assert.equal(response.headers.get('X-Robots-Tag'), 'noindex')
		assert.equal(response.headers.get('location'), null)
		assert.equal(await response.text(), 'Not Found')
	})
}

test('keeps language negotiation and query strings on existing unprefixed routes', () => {
	for (const pathname of ['/produkte', '/produkte/fingernagel', '/faq', '/datenschutzerklarung']) {
		const response = proxy(request(`${pathname}?source=test`, { 'accept-language': 'pl' }))
		assert.equal(response.status, 307)
		assert.equal(response.headers.get('location'), `https://www.iwonnaildisplay.de/pl${pathname}?source=test`)
	}
})

test('root always redirects permanently to German without an intermediate trailing slash', () => {
	for (const headers of [{}, { 'accept-language': 'en-US,en;q=0.9' }, { cookie: 'i18next=pl', 'accept-language': 'pl' }, { cookie: 'i18next=en' }]) {
		for (const query of ['', '?source=test']) {
			const response = proxy(request(`/${query}`, headers))
			assert.equal(response.status, 308)
			assert.equal(response.headers.get('location'), `https://www.iwonnaildisplay.de/de${query}`)
		}
	}
})

test('only valid full language segments in referrers can set the language cookie', () => {
	assert.equal(proxy(request('/pl', { referer: 'https://www.iwonnaildisplay.de/en/produkte' })).cookies.get('i18next')?.value, 'en')
	assert.equal(proxy(request('/pl', { referer: 'https://www.iwonnaildisplay.de/english' })).cookies.get('i18next'), undefined)
})
