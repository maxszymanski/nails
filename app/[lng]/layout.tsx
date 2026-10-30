import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { languages } from '../i18n/settings'
import { notFound } from 'next/navigation'
import { dir } from 'i18next'
import AosProvider from '@/src/components/ui/AosProvider'
import Navbar from '@/src/components/nav/Navbar'
import Footer from '@/src/components/footer/Footer'
import Toaster from '@/src/components/ui/Toaster'
import ModalsControler from '@/src/components/ui/ModalsControler'
import { SITE_URL } from '@/src/lib/seo'

const outfit = Outfit({
	subsets: ['latin'],
	variable: '--font-outfit',
})

const defaultMetadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	icons: {
		icon: [
			{ url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
			{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
			{ url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
			{ url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
			{ url: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
		],
		apple: [{ url: '/apple-touche-icon.png', sizes: '180x180', type: 'image/png' }],
	},
	title: {
		template: '%s | Iwon',
		default: 'Iwon',
	},
	description: 'Iwon nails',
}

export async function generateStaticParams() {
	return languages.map(lng => ({ lng }))
}

export type Params = Promise<{ lng: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
	const { lng } = await params
	if (!languages.includes(lng)) notFound()
	const image = `/og-image-${lng}.png`

	return {
		...defaultMetadata,
		openGraph: {
			images: [{ url: image, width: 1200, height: 630, alt: 'Iwon Nail Display' }],
		},
		twitter: {
			card: 'summary_large_image',
			images: [image],
		},
	}
}

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode
	params: Params
}>) {
	const { lng } = await params
	if (!languages.includes(lng)) notFound()

	return (
		<html lang={lng} dir={dir(lng)} className={`${outfit.className} h-full antialiased `}>
			<body className="tracking-shrink flex flex-col relative w-full my-scrollbar bg-white text-black-primary h-full">
				<Navbar lng={lng} />
				<AosProvider>{children}</AosProvider>
				<Toaster />
				<ModalsControler />
				<Footer lng={lng} />
			</body>
		</html>
	)
}
