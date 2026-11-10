'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useT } from '@/app/i18n/client'
import { createWithdrawalFormSchema, type WithdrawalFormValues } from '@/src/lib/withdrawal-form'
import { submitCustomerRequest } from '@/src/lib/submit-customer-request'
import Input from './Input'
import Checkbox from './Checkbox'
import Button from './Button'
import FormSuccessModal from './FormSuccessModal'

function WithdrawalForm({ lng }: { lng: string }) {
	const { t } = useT('translations')
	const [showSuccess, setShowSuccess] = useState(false)
	const submitting = useRef(false)
	const { register, handleSubmit, control, reset, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<WithdrawalFormValues>({
		resolver: zodResolver(createWithdrawalFormSchema(t)),
		defaultValues: { firstName: '', lastName: '', email: '', orderNumber: '', scope: 'all', terms: false },
	})
	const scope = useWatch({ control, name: 'scope' })

	const onSubmit = async (data: WithdrawalFormValues) => {
		if (submitting.current) return
		submitting.current = true
		clearErrors('root')
		try {
			const { returnedProducts, ...values } = data
			await submitCustomerRequest({ kind: 'withdrawal', lng, data: values.scope === 'selected' ? { ...values, returnedProducts } : values })
			reset()
			setShowSuccess(true)
		} catch (error) {
			setError('root.submit', { message: t(error instanceof Error && error.message === 'REQUEST_EXPIRED' ? 'formSubmission.expired' : 'formSubmission.error') })
		} finally {
			submitting.current = false
		}
	}

	return (
		<form noValidate aria-busy={isSubmitting} onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<Input required id="withdrawal-first-name" autoComplete="given-name" maxLength={100}
					label={t('withdrawalForm.firstName')} placeholder={t('withdrawalForm.firstName')}
					formRegister={register('firstName')} error={errors.firstName} message={errors.firstName?.message} disabled={isSubmitting} />
				<Input required id="withdrawal-last-name" autoComplete="family-name" maxLength={100}
					label={t('withdrawalForm.lastName')} placeholder={t('withdrawalForm.lastName')}
					formRegister={register('lastName')} error={errors.lastName} message={errors.lastName?.message} disabled={isSubmitting} />
			</div>
			<Input required type="email" id="withdrawal-email" autoComplete="email" maxLength={254}
				label={t('withdrawalForm.email')} placeholder={t('withdrawalForm.email')}
				formRegister={register('email')} error={errors.email} message={errors.email?.message} disabled={isSubmitting} />
			<Input required type="text" id="withdrawal-order-number" autoComplete="off" maxLength={14}
				label={t('withdrawalForm.orderNumber')} placeholder="IND-1234567890"
				formRegister={register('orderNumber')} error={errors.orderNumber} message={errors.orderNumber?.message} disabled={isSubmitting} />
			<fieldset className="min-w-0" disabled={isSubmitting} aria-describedby={errors.scope ? 'withdrawal-scope-error' : undefined}>
				<legend className="text-grayscale-500 leading-6 mb-3">
					{t('withdrawalForm.scope')}<span aria-hidden="true" className="text-my-purple">*</span>
				</legend>
				<div className="flex flex-col gap-3">
					{(['all', 'selected'] as const).map(scope => (
						<label key={scope} className="inline-flex items-center gap-3 cursor-pointer text-grayscale-500 text-sm leading-5" htmlFor={`withdrawal-scope-${scope}`}>
							<span className="relative flex shrink-0 items-center">
								<input type="radio" id={`withdrawal-scope-${scope}`} value={scope} required
									{...register('scope')}
									className="peer size-4 appearance-none rounded-full border border-grayscale-200 checked:border-my-purple cursor-pointer focus-visible:outline-2 focus-visible:outline-my-purple focus-visible:outline-offset-2" />
								<span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-my-purple opacity-0 peer-checked:opacity-100" />
							</span>
							{t(`withdrawalForm.${scope}`)}
						</label>
					))}
				</div>
				{errors.scope && <span id="withdrawal-scope-error" role="alert" className="mt-2 block text-xs text-alert">{errors.scope.message}</span>}
			</fieldset>
			{scope === 'selected' && (
				<Input required type="text" id="withdrawal-returned-products" autoComplete="off" maxLength={2000}
					label={t('withdrawalForm.returnedProducts')} placeholder={t('withdrawalForm.returnedProducts')}
					formRegister={register('returnedProducts', { shouldUnregister: true })} error={errors.returnedProducts}
					message={errors.returnedProducts?.message} disabled={isSubmitting} />
			)}
			<Checkbox required name="withdrawal-terms" formRegister={register('terms')} error={errors.terms} message={errors.terms?.message} disabled={isSubmitting}
				label={<>{t('withdrawalForm.accept')}{' '}
					<Link href={`/${lng}/widerruf`} target="_blank" rel="noopener noreferrer" className="underline hover:text-black-primary duration-300">
						{t('withdrawalForm.policy')}
					</Link>
				</>} />
			{errors.root?.submit?.message && <p role="alert" className="text-sm leading-6 text-alert">{errors.root.submit.message}</p>}
			<Button type="submit" disabled={isSubmitting} restClass="w-full disabled:opacity-50 disabled:cursor-not-allowed">
				{t(isSubmitting ? 'formSubmission.sending' : 'withdrawalForm.submit')}
			</Button>
			{showSuccess && <FormSuccessModal kind="withdrawal" onClose={() => setShowSuccess(false)} />}
		</form>
	)
}

export default WithdrawalForm
