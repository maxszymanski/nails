'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type FieldError, type UseFormRegisterReturn } from 'react-hook-form'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useT } from '@/app/i18n/client'
import { products } from '@/src/data/products'
import { submitCustomerRequest } from '@/src/lib/submit-customer-request'
import {
	COMPLAINT_PROBLEMS,
	COMPLAINT_RESOLUTIONS,
	createComplaintFormSchema,
	type ComplaintFormValues,
} from '@/src/lib/complaint-form'
import Input from './Input'
import Checkbox from './Checkbox'
import Button from './Button'
import FormSuccessModal from './FormSuccessModal'

function ComplaintRadioGroup({
	name,
	label,
	options,
	registration,
	error,
	disabled,
}: {
	name: 'product' | 'problem' | 'resolution'
	label: string
	options: { value: string; label: string }[]
	registration: UseFormRegisterReturn
	error?: FieldError
	disabled: boolean
}) {
	return (
		<fieldset
			className="min-w-0"
			disabled={disabled}
			aria-describedby={error ? `complaint-${name}-error` : undefined}>
			<legend className="text-grayscale-500 leading-6 mb-3">
				{label}
				<span aria-hidden="true" className="text-my-purple">
					*
				</span>
			</legend>
			<div className="flex flex-col gap-3">
				{options.map(option => (
					<label
						key={option.value}
						htmlFor={`complaint-${name}-${option.value}`}
						className="inline-flex items-center gap-3 cursor-pointer text-grayscale-500 text-sm leading-5">
						<span className="relative flex shrink-0 items-center">
							<input
								type="radio"
								id={`complaint-${name}-${option.value}`}
								value={option.value}
								required
								{...registration}
								className="peer size-4 appearance-none rounded-full border border-grayscale-200 checked:border-my-purple cursor-pointer focus-visible:outline-2 focus-visible:outline-my-purple focus-visible:outline-offset-2"
							/>
							<span
								aria-hidden="true"
								className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-my-purple opacity-0 peer-checked:opacity-100"
							/>
						</span>
						{option.label}
					</label>
				))}
			</div>
			{error && (
				<span id={`complaint-${name}-error`} role="alert" className="mt-2 block text-xs text-alert">
					{error.message}
				</span>
			)}
		</fieldset>
	)
}

function ComplaintForm({ lng }: { lng: string }) {
	const { t } = useT('translations')
	const [showSuccess, setShowSuccess] = useState(false)
	const submitting = useRef(false)
	const {
		register,
		handleSubmit,
		reset,
		setError,
		clearErrors,
		formState: { errors, isSubmitting },
	} = useForm<ComplaintFormValues>({
		resolver: zodResolver(createComplaintFormSchema(t)),
		defaultValues: { firstName: '', lastName: '', email: '', orderNumber: '', description: '', terms: false },
	})

	const onSubmit = async (data: ComplaintFormValues) => {
		if (submitting.current) return
		submitting.current = true
		clearErrors('root')
		try {
			await submitCustomerRequest({ kind: 'complaint', lng, data })
			reset()
			setShowSuccess(true)
		} catch (error) {
			setError('root.submit', { message: t(error instanceof Error && error.message === 'REQUEST_EXPIRED' ? 'formSubmission.expired' : 'formSubmission.error') })
		} finally {
			submitting.current = false
		}
	}

	return (
		<form noValidate aria-busy={isSubmitting} onSubmit={event => handleSubmit(onSubmit)(event)} className="w-full flex flex-col gap-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<Input
					required
					id="complaint-first-name"
					autoComplete="given-name"
					maxLength={100}
					label={t('complaintForm.firstName')}
					placeholder={t('complaintForm.firstName')}
					formRegister={register('firstName')}
					error={errors.firstName}
					message={errors.firstName?.message}
					disabled={isSubmitting}
				/>
				<Input
					required
					id="complaint-last-name"
					autoComplete="family-name"
					maxLength={100}
					label={t('complaintForm.lastName')}
					placeholder={t('complaintForm.lastName')}
					formRegister={register('lastName')}
					error={errors.lastName}
					message={errors.lastName?.message}
					disabled={isSubmitting}
				/>
			</div>
			<Input
				required
				type="email"
				id="complaint-email"
				autoComplete="email"
				maxLength={254}
				label={t('complaintForm.email')}
				placeholder={t('complaintForm.email')}
				formRegister={register('email')}
				error={errors.email}
				message={errors.email?.message}
				disabled={isSubmitting}
			/>
			<Input
				required
				type="text"
				id="complaint-order-number"
				autoComplete="off"
				maxLength={14}
				label={t('complaintForm.orderNumber')}
				placeholder="IND-1234567890"
				formRegister={register('orderNumber')}
				error={errors.orderNumber}
				message={errors.orderNumber?.message}
				disabled={isSubmitting}
			/>
			<ComplaintRadioGroup
				name="product"
				label={t('complaintForm.product')}
				registration={register('product')}
				error={errors.product}
				disabled={isSubmitting}
				options={products.map(product => ({
					value: product.name,
					label: t(`products.products.${product.name}`),
				}))}
			/>
			<ComplaintRadioGroup
				name="problem"
				label={t('complaintForm.problem')}
				registration={register('problem')}
				error={errors.problem}
				disabled={isSubmitting}
				options={COMPLAINT_PROBLEMS.map(problem => ({
					value: problem,
					label: t(`complaintForm.problems.${problem}`),
				}))}
			/>
			<Input
				required
				textarea
				id="complaint-description"
				autoComplete="off"
				maxLength={5000}
				style={{ minHeight: 120, resize: 'none' }}
				label={t('complaintForm.description')}
				placeholder={t('complaintForm.description')}
				formRegister={register('description')}
				error={errors.description}
				message={errors.description?.message}
				disabled={isSubmitting}
			/>
			<ComplaintRadioGroup
				name="resolution"
				label={t('complaintForm.resolution')}
				registration={register('resolution')}
				error={errors.resolution}
				disabled={isSubmitting}
				options={COMPLAINT_RESOLUTIONS.map(resolution => ({
					value: resolution,
					label: t(`complaintForm.resolutions.${resolution}`),
				}))}
			/>
			<Checkbox
				required
				name="complaint-terms"
				formRegister={register('terms')}
				error={errors.terms}
				message={errors.terms?.message}
				disabled={isSubmitting}
				label={
					<>
						{t('complaintForm.acknowledge')}{' '}
						<Link
							href={`/${lng}/reklamation`}
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-black-primary duration-300">
							{t('complaintForm.policy')}
						</Link>
					</>
				}
			/>
			{errors.root?.submit?.message && <p role="alert" className="text-sm leading-6 text-alert">{errors.root.submit.message}</p>}
			<Button
				type="submit"
				disabled={isSubmitting}
				restClass="w-full disabled:opacity-50 disabled:cursor-not-allowed">
				{t(isSubmitting ? 'formSubmission.sending' : 'complaintForm.submit')}
			</Button>
			{showSuccess && <FormSuccessModal kind="complaint" onClose={() => setShowSuccess(false)} />}
		</form>
	)
}

export default ComplaintForm
