import { company } from '@/src/data/company'
import en from '@/app/i18n/locales/en/translations.json'
import de from '@/app/i18n/locales/de/translations.json'
import pl from '@/app/i18n/locales/pl/translations.json'
import type { CustomerRequest } from './customer-request'

const translations = { en, de, pl }

function escapeHtml(value: string) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function details(request: CustomerRequest, lng: CustomerRequest['lng']) {
	const t = translations[lng]
	const labels = request.kind === 'withdrawal' ? t.withdrawalForm : t.complaintForm
	const rows = [
		[labels.firstName, request.data.firstName],
		[labels.lastName, request.data.lastName],
		[labels.email, request.data.email],
		[labels.orderNumber, request.data.orderNumber],
	]
	if (request.kind === 'withdrawal') {
		rows.push([t.withdrawalForm.scope, t.withdrawalForm[request.data.scope]])
		if (request.data.scope === 'selected') rows.push([t.withdrawalForm.returnedProducts, request.data.returnedProducts!])
	} else {
		rows.push(
			[t.complaintForm.product, t.products.products[request.data.product]],
			[t.complaintForm.problem, t.complaintForm.problems[request.data.problem]],
			[t.complaintForm.description, request.data.description],
			[t.complaintForm.resolution, t.complaintForm.resolutions[request.data.resolution]],
		)
	}
	rows.push([request.kind === 'withdrawal' ? t.withdrawalForm.policy : t.complaintForm.policy, t.customerRequestEmail.acknowledged])
	return rows
}

function renderEmail(lng: CustomerRequest['lng'], title: string, paragraphs: string[], rows: string[][]) {
	const t = translations[lng]
	const copy = t.customerRequestEmail
	const footer = `${company.name}\n${t.footer.owner}: ${company.owner}\n${company.street}\n${company.postalCode} ${company.city}\n${company.phone}\n${company.email}\n${company.website}\nUSt-IdNr.: ${company.vatId}\nSteuernummer: 147/5193/3161`
	const html = `<!doctype html>
		<html lang="${lng}"><body style="margin: 0; background: #f2f2f2;">
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f2f2f2; font-family: Arial, sans-serif; color: #060606; line-height: 1.5;">
			<tr><td align="center" style="padding: 32px 16px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
					<tr><td style="height: 6px; background: #725fff; font-size: 0;">&nbsp;</td></tr>
					<tr><td style="padding: 28px 24px; overflow-wrap: anywhere; word-break: break-word;">
						<p style="margin: 0 0 10px; color: #725fff; font-size: 13px; font-weight: 700;">Iwonnaildisplay</p>
						<h1 style="margin: 0 0 16px; font-size: 26px; line-height: 1.2;">${escapeHtml(title)}</h1>
						${paragraphs.map(paragraph => `<p style="margin: 0 0 12px; color: #565656; font-size: 15px;">${escapeHtml(paragraph)}</p>`).join('')}
						<h2 style="margin: 24px 0 12px; font-size: 18px;">${escapeHtml(copy.detailsTitle)}</h2>
						<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; table-layout: fixed; font-size: 14px;">
							${rows.map(([label, value]) => `<tr><th scope="row" style="width: 40%; padding: 12px 12px 12px 0; border-bottom: 1px solid #e5e5e5; text-align: left; vertical-align: top; color: #565656; font-weight: 400;">${escapeHtml(label)}</th><td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; vertical-align: top; white-space: pre-wrap;">${escapeHtml(value)}</td></tr>`).join('')}
						</table>
						<p style="margin: 24px 0 0; font-size: 15px; font-weight: 600;">${escapeHtml(copy.regards)}</p>
						<p style="margin: 24px 0 0; padding-top: 16px; border-top: 1px solid #e5e5e5; color: #565656; font-size: 12px; white-space: pre-line;">${escapeHtml(footer)}</p>
					</td></tr>
				</table>
			</td></tr>
		</table></body></html>`
	return {
		html,
		text: [title, ...paragraphs, copy.detailsTitle, ...rows.map(([label, value]) => `${label}: ${value}`), copy.regards, footer].join('\n\n'),
	}
}

export function customerRequestEmails(request: CustomerRequest, from: string, owner: string) {
	const copy = translations[request.lng].customerRequestEmail
	const template = copy[request.kind]
	const ownerTitle = `${request.kind === 'withdrawal' ? 'Neuer Widerruf' : 'Neue Reklamation'} #${request.data.orderNumber}`
	const customerTitle = `${template.subject} #${request.data.orderNumber}`
	return [
		{
			from, to: owner, replyTo: request.data.email, subject: ownerTitle,
			...renderEmail('de', ownerTitle, [de.customerRequestEmail.ownerIntro], [
				...details(request, 'de'), [de.customerRequestEmail.language, request.lng.toUpperCase()],
			]),
		},
		{
			from, to: request.data.email, replyTo: owner, subject: customerTitle,
			...renderEmail(request.lng, customerTitle, [copy.greeting, template.message], details(request, request.lng)),
		},
	]
}
