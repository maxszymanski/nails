import { getT } from '../i18n'

export default async function Home() {
	const { t } = await getT('translations')

	return (
		<div className=" ">
			<p className="mt-40">{t('nav.home')}</p>
		</div>
	)
}
