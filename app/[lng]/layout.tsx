import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { languages } from '../i18n/settings'
import { dir } from 'i18next'
import AosProvider from '@/src/components/ui/AosProvider'
import Navbar from '@/src/components/nav/Navbar'
import Footer from '@/src/components/footer/Footer'
import Toaster from '@/src/components/ui/Toaster'
import ModalsControler from '@/src/components/ui/ModalsControler'

const outfit = Outfit({
	subsets: ['latin'],
	variable: '--font-outfit',
})

export const metadata: Metadata = {
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

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode
	params: Params
}>) {
	const { lng } = await params

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
