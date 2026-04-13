import { getT } from '../i18n'

export default async function Home() {
	const { t } = await getT('navbar')

	return (
		<div className=" ">
			<p>{t('nav.title')}</p>
			<div className="mt-40 w-full h-30 bg-black"></div>
			<div className="mt-40 w-full h-30 bg-black"></div>
			<div className="mt-40 w-full h-30 bg-black"></div>
			<div className="mt-40 w-full h-30 bg-black"></div>
		</div>
	)
}
