import { Resend } from 'resend'
import { z } from 'zod'
import { products, SHIPPING } from '@/src/data/products'
import en from '@/app/i18n/locales/en/translations.json'
import de from '@/app/i18n/locales/de/translations.json'
import pl from '@/app/i18n/locales/pl/translations.json'

const translations = { en, de, pl }

const orderSchema = z.strictObject({
	orderId: z.uuid(),
	createdAt: z.iso.datetime(),
	lng: z.enum(['pl', 'de', 'en']).catch('en'),
	customer: z.object({
		firstName: z.string().trim().min(3).max(100),
		lastName: z.string().trim().min(3).max(100),
		address: z.string().trim().min(1).max(300),
		zipCode: z.string().trim().regex(/^(\d{2}-\d{3}|\d{5})$/),
		city: z.string().trim().min(2).max(100),
		email: z.email(),
		instagram: z.string().max(100).optional(),
		message: z.string().max(5000).optional(),
		terms: z.literal(true),
	}),
	cart: z.strictObject({
		items: z
			.array(
				z.strictObject({
					id: z.number().int().nonnegative(),
					quantity: z.number().int().positive().max(10000),
				}),
			)
			.min(1)
			.max(products.length)
			.refine(items => new Set(items.map(item => item.id)).size === items.length),
	}),
})

const templates = {
	pl: {
		subject: 'Twoje zamówienie w Iwonnaildisplay',
		greeting: 'Witaj!',
		intro: 'Dziękujemy za zamówienie. Oto dane do płatności (przedpłata):',
		orderTitle: 'Twoje zamówienie',
		orderNumberLabel: 'Nr zamówienia',
		product: 'Produkt',
		quantity: 'Ilość',
		price: 'Cena',
		total: 'Razem z dostawą',
		optionBank: 'Opcja 1: Przelew bankowy',
		recipient: 'Odbiorca',
		iban: 'IBAN',
		bic: 'BIC',
		optionPaypal: 'Opcja 2: PayPal',
		paypal: 'Adres PayPal',
		shippingTitle: 'Wysyłka',
		shipping:
			'Paczka zostanie nadana na poczcie w ciągu 3 dni roboczych od momentu zaksięgowania wpłaty, na adres dostawy podany przez Ciebie w formularzu.',
		instagram:
			'Jeśli masz pytania o wymiary do regałów IKEA, napisz do nas na Instagramie (@iwonnaildisplay).',
		regards: 'Pozdrawiamy, Twój zespół Iwonnaildisplay',
	},
	de: {
		subject: 'Deine Bestellung bei Iwonnaildisplay',
		greeting: 'Hallo!',
		intro: 'Vielen Dank für deine Bestellung. Hier sind deine Zahlungsdaten (Vorkasse):',
		orderTitle: 'Deine Bestellung',
		orderNumberLabel: 'Bestellnummer',
		product: 'Produkt',
		quantity: 'Menge',
		price: 'Preis',
		total: 'Gesamtbetrag inkl. Versand',
		optionBank: 'Option 1: Banküberweisung',
		recipient: 'Empfänger',
		iban: 'IBAN',
		bic: 'BIC',
		optionPaypal: 'Option 2: PayPal',
		paypal: 'PayPal-Adresse',
		shippingTitle: 'Versand',
		shipping:
			'Der Versand erfolgt innerhalb von 3 Werktagen nach Erhalt des Geldes an die von dir im Formular angegebene Lieferadresse.',
		instagram:
			'Bei Fragen zu den Maßen für deine IKEA-Regale schreib uns einfach auf Instagram (@iwonnaildisplay).',
		regards: 'Liebe Grüße, Dein Team von Iwonnaildisplay',
	},
	en: {
		subject: 'Your order at Iwonnaildisplay',
		greeting: 'Hello!',
		intro: 'Thank you for your order. Here are the payment details (prepayment):',
		orderTitle: 'Your order',
		orderNumberLabel: 'Order number',
		product: 'Product',
		quantity: 'Quantity',
		price: 'Price',
		total: 'Total including shipping',
		optionBank: 'Option 1: Bank Transfer',
		recipient: 'Recipient',
		iban: 'IBAN',
		bic: 'BIC',
		optionPaypal: 'Option 2: PayPal',
		paypal: 'PayPal address',
		shippingTitle: 'Shipping',
		shipping:
			'Your package will be shipped within 3 business days of the payment being credited, to the delivery address provided in the form.',
		instagram:
			'If you have any questions about the dimensions for IKEA shelves, please contact us on Instagram (@iwonnaildisplay).',
		regards: 'Best regards, Your Iwonnaildisplay Team',
	},
} as const

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;')
}

function formatPrice(value: number, lng: keyof typeof templates) {
	return new Intl.NumberFormat(lng, {
		style: 'currency',
		currency: 'EUR',
	}).format(value)
}

export async function POST(req: Request) {
	let body: unknown
	try {
		body = await req.json()
	} catch {
		return Response.json({ error: 'Invalid order data' }, { status: 400 })
	}
	const parsed = orderSchema.safeParse(body)

	if (!parsed.success) {
		return Response.json({ error: 'Invalid order data' }, { status: 400 })
	}

	const { customer, lng, orderId, createdAt } = parsed.data
	// Resend keeps idempotency keys for 24 hours; never resend an expired attempt.
	const age = Date.now() - Date.parse(createdAt)
	if (age >= 23 * 60 * 60 * 1000 || age < -5 * 60 * 1000) {
		return Response.json({ error: 'Order attempt expired', code: 'ORDER_EXPIRED' }, { status: 409 })
	}
	const items = []
	for (const item of parsed.data.cart.items) {
		const product = products.find(product => product.id === item.id)
		if (!product) {
			return Response.json({ error: 'Unknown product' }, { status: 400 })
		}
		items.push({
			name: translations[lng].products.products[product.name],
			quantity: item.quantity,
			totalCents: Math.round(product.price * 100) * item.quantity,
		})
	}
	const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0)
	if (!Number.isSafeInteger(subtotalCents) || subtotalCents <= 1) {
		return Response.json({ error: 'Invalid order total' }, { status: 400 })
	}
	const shippingCents = subtotalCents >= 15000 ? 0 : Math.round(SHIPPING * 100)
	const totalWithShipping = (subtotalCents + shippingCents) / 100
	const template = templates[lng]
	const numericOrderId = BigInt(`0x${orderId.replaceAll('-', '')}`) % BigInt(10_000_000_000)
	const orderNumber = `IND-${numericOrderId.toString().padStart(10, '0')}`
	const apiKey = process.env.RESEND_API_KEY?.trim()
	const ownerEmail = process.env.ORDER_OWNER_EMAIL?.trim()
	const fromEmail = process.env.ORDER_FROM_EMAIL?.trim()
	const paymentRecipient = process.env.PAYMENT_RECIPIENT
	const paymentIban = process.env.PAYMENT_IBAN
	const paymentBic = process.env.PAYMENT_BIC
	const paypalEmail = process.env.PAYPAL_EMAIL

	if (
		!apiKey ||
		!fromEmail ||
		!ownerEmail ||
		!z.email().safeParse(ownerEmail).success ||
		!paymentRecipient?.trim() ||
		!paymentIban?.trim() ||
		!paymentBic?.trim() ||
		!paypalEmail?.trim()
	) {
		return Response.json({ error: 'Missing order configuration' }, { status: 503 })
	}

	const itemsHtml = items
		.map(
			item => `
				<tr>
					<td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #060606; font-weight: 600;">${escapeHtml(item.name)}</td>
					<td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #565656; text-align: center;">${item.quantity}</td>
					<td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #060606; text-align: right; font-weight: 600;">${formatPrice(
						item.totalCents / 100,
						lng,
					)}</td>
				</tr>`,
		)
		.join('')

	const html = `
		<div style="margin: 0; padding: 32px 16px; background: #f2f2f2; font-family: Arial, sans-serif; color: #060606; line-height: 1.5;">
			<div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 18px; overflow: hidden;">
				<div style="height: 6px; background: #725fff;"></div>
				<div style="padding: 28px 24px;">
					<p style="margin: 0 0 10px; color: #725fff; font-size: 13px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase;">Iwonnaildisplay</p>
					<h1 style="margin: 0 0 16px; color: #060606; font-size: 28px; line-height: 1.18; font-weight: 700;">${template.subject} 💅</h1>
					<p style="margin: 0 0 8px; color: #060606; font-size: 16px;">${template.greeting}</p>
					<p style="margin: 0; color: #565656; font-size: 15px;">${template.intro}</p>

					<div style="margin-top: 22px; background: #f2f2f2; border: 1px solid #e5e5e5; border-radius: 14px; padding: 18px;">
						<h2 style="margin: 0 0 12px; color: #060606; font-size: 18px; line-height: 1.3;">${template.optionBank}</h2>
						<p style="margin: 0 0 6px; color: #565656;"><strong style="color: #060606;">${template.recipient}:</strong> ${escapeHtml(paymentRecipient)}</p>
						<p style="margin: 0 0 6px; color: #565656;"><strong style="color: #060606;">${template.iban}:</strong> ${escapeHtml(paymentIban)}</p>
						<p style="margin: 0; color: #565656;"><strong style="color: #060606;">${template.bic}:</strong> ${escapeHtml(paymentBic)}</p>
					</div>

					<div style="margin-top: 12px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 14px; padding: 18px;">
						<h2 style="margin: 0 0 12px; color: #060606; font-size: 18px; line-height: 1.3;">${template.optionPaypal}</h2>
						<p style="margin: 0; color: #565656;"><strong style="color: #060606;">${template.paypal}:</strong> ${escapeHtml(paypalEmail)}</p>
					</div>

					<h2 style="margin: 26px 0 4px; color: #060606; font-size: 20px; line-height: 1.3;">${template.orderTitle}</h2>
					<p style="margin: 0 0 12px; color: #565656; font-size: 14px;">${template.orderNumberLabel}: <strong style="color: #060606;">${orderNumber}</strong></p>
					<table style="width: 100%; border-collapse: collapse; font-size: 14px;">
						<thead>
							<tr>
								<th style="padding: 0 0 10px; border-bottom: 1px solid #e5e5e5; color: #565656; font-size: 12px; font-weight: 700; text-align: left; text-transform: uppercase;">${template.product}</th>
								<th style="padding: 0 0 10px; border-bottom: 1px solid #e5e5e5; color: #565656; font-size: 12px; font-weight: 700; text-align: center; text-transform: uppercase;">${template.quantity}</th>
								<th style="padding: 0 0 10px; border-bottom: 1px solid #e5e5e5; color: #565656; font-size: 12px; font-weight: 700; text-align: right; text-transform: uppercase;">${template.price}</th>
							</tr>
						</thead>
						<tbody>${itemsHtml}</tbody>
					</table>

					<div style="margin-top: 16px; padding: 16px 18px; background: #725fff; border-radius: 14px; color: #ffffff;">
						<p style="margin: 0; font-size: 13px; opacity: 0.86;">${template.total}</p>
						<p style="margin: 2px 0 0; font-size: 24px; line-height: 1.2; font-weight: 700;">${formatPrice(totalWithShipping, lng)}</p>
					</div>

					<h2 style="margin: 26px 0 10px; color: #060606; font-size: 20px; line-height: 1.3;">${template.shippingTitle}</h2>
					<p style="margin: 0 0 10px; color: #565656; font-size: 15px;">${template.shipping}</p>
					<p style="margin: 0 0 22px; color: #565656; font-size: 15px;">${template.instagram}</p>
					<p style="margin: 0; color: #060606; font-size: 15px; font-weight: 600;">${template.regards}</p>
				</div>
			</div>
		</div>
	`

	const customerName = escapeHtml(`${customer.firstName} ${customer.lastName}`)
	const deliveryAddress = escapeHtml(`${customer.address}, ${customer.zipCode} ${customer.city}`)

	const ownerHtml = `
		<div style="margin: 0; padding: 32px 16px; background: #f2f2f2; font-family: Arial, sans-serif; color: #060606; line-height: 1.5;">
			<div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 18px; overflow: hidden;">
				<div style="height: 6px; background: #725fff;"></div>
				<div style="padding: 28px 24px;">
					<p style="margin: 0 0 10px; color: #725fff; font-size: 13px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase;">Iwonnaildisplay</p>
					<h1 style="margin: 0 0 16px; color: #060606; font-size: 26px; line-height: 1.2;">Nowe zamówienie #${orderNumber}</h1>

					<div style="background: #f2f2f2; border: 1px solid #e5e5e5; border-radius: 14px; padding: 18px;">
						<h2 style="margin: 0 0 12px; color: #060606; font-size: 18px; line-height: 1.3;">Dane klienta</h2>
						<p style="margin: 0 0 6px; color: #565656;"><strong style="color: #060606;">Imię i nazwisko:</strong> ${customerName}</p>
						<p style="margin: 0 0 6px; color: #565656;"><strong style="color: #060606;">Email:</strong> ${escapeHtml(customer.email)}</p>
						<p style="margin: 0 0 6px; color: #565656;"><strong style="color: #060606;">Instagram:</strong> ${escapeHtml(customer.instagram || '-')}</p>
						<p style="margin: 0; color: #565656;"><strong style="color: #060606;">Wiadomość:</strong> ${escapeHtml(customer.message || '-')}</p>
					</div>

					<div style="margin-top: 12px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 14px; padding: 18px;">
						<h2 style="margin: 0 0 12px; color: #060606; font-size: 18px; line-height: 1.3;">Adres dostawy</h2>
						<p style="margin: 0; color: #565656;">${deliveryAddress}</p>
					</div>

					<h2 style="margin: 26px 0 12px; color: #060606; font-size: 20px; line-height: 1.3;">Co spakować</h2>
					<table style="width: 100%; border-collapse: collapse; font-size: 14px;">
						<thead>
							<tr>
								<th style="padding: 0 0 10px; border-bottom: 1px solid #e5e5e5; color: #565656; font-size: 12px; font-weight: 700; text-align: left; text-transform: uppercase;">Produkt</th>
								<th style="padding: 0 0 10px; border-bottom: 1px solid #e5e5e5; color: #565656; font-size: 12px; font-weight: 700; text-align: center; text-transform: uppercase;">Ilość</th>
								<th style="padding: 0 0 10px; border-bottom: 1px solid #e5e5e5; color: #565656; font-size: 12px; font-weight: 700; text-align: right; text-transform: uppercase;">Cena</th>
							</tr>
						</thead>
						<tbody>${itemsHtml}</tbody>
					</table>

					<div style="margin-top: 16px; padding: 16px 18px; background: #725fff; border-radius: 14px; color: #ffffff;">
						<p style="margin: 0; font-size: 13px; opacity: 0.86;">Do zapłaty razem z dostawą</p>
						<p style="margin: 2px 0 0; font-size: 24px; line-height: 1.2; font-weight: 700;">${formatPrice(totalWithShipping, lng)}</p>
					</div>
				</div>
			</div>
		</div>
	`

	try {
		const resend = new Resend(apiKey)
		const { data, error } = await resend.batch.send(
			[
				{ from: fromEmail, to: ownerEmail, subject: `Nowe zamówienie #${orderNumber}`, html: ownerHtml },
				{ from: fromEmail, to: customer.email, subject: `${template.subject} #${orderNumber} 💅`, html },
			],
			{ idempotencyKey: `order/${orderId}`, batchValidation: 'strict' },
		)
		if (error || data?.data.length !== 2) {
			return Response.json({ error: 'Order email delivery failed' }, { status: 502 })
		}
	} catch {
		return Response.json({ error: 'Order email delivery failed' }, { status: 502 })
	}

	return Response.json({ ok: true, orderNumber, totalWithShipping })
}
