'use client'

import { useId } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '@/app/i18n/client'
import Modal from './Modal'
import Button from './Button'

function FormSuccessModal({ kind, onClose }: { kind: 'withdrawal' | 'complaint'; onClose: () => void }) {
	const { t } = useT('translations')
	const titleId = useId()
	const messageId = useId()
	const prefix = kind === 'withdrawal' ? 'withdrawalForm' : 'complaintForm'

	return createPortal(
		<Modal centered labelledBy={titleId} describedBy={messageId} mutation={onClose}>
			<div className="w-full rounded-lg border border-grayscale-200 bg-white p-6 sm:p-8 [overflow-wrap:anywhere]">
				<h2 id={titleId} className="text-2xl leading-8 font-medium">{t(`${prefix}.success.title`)}</h2>
				<p id={messageId} className="text-grayscale-500 leading-6 mt-4">{t(`${prefix}.success.message`)}</p>
				<Button type="button" onClick={onClose} restClass="w-full mt-6">{t('formConfirmation.close')}</Button>
			</div>
		</Modal>,
		document.body,
	)
}

export default FormSuccessModal
