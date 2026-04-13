import { getT } from '../i18n'

export default async function Home() {
	const { t } = await getT('navbar')

	return (
		<div className="flex-1 overflow-hidden ">
			<p>{t('nav.title')}</p>{' '}
		</div>
	)
}
