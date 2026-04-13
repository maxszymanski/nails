import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { languages } from '../i18n/settings'
import { dir } from 'i18next'
import AosProvider from '@/src/components/ui/AosProvider'
import Navbar from '@/src/components/nav/Navbar'

const outfit = Outfit({
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: 'Iwon',
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
			<body className="tracking-[-0.7%] flex flex-col relative w-full my-scrollbar bg-white">
				<Navbar lng={lng} />
				<AosProvider>{children}</AosProvider>
			</body>
		</html>
	)
}
