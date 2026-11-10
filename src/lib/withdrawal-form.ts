import z from 'zod'

export function createWithdrawalFormSchema(t: (key: string) => string) {
	return z.object({
		firstName: z.string().trim().min(1, t('withdrawalForm.validation.firstName')).max(100, t('withdrawalForm.validation.nameMax'))
			.regex(/^[\p{L}\p{M}][\p{L}\p{M} .'\u2019-]*$/u, t('withdrawalForm.validation.nameInvalid')),
		lastName: z.string().trim().min(1, t('withdrawalForm.validation.lastName')).max(100, t('withdrawalForm.validation.nameMax'))
			.regex(/^[\p{L}\p{M}][\p{L}\p{M} .'\u2019-]*$/u, t('withdrawalForm.validation.nameInvalid')),
		email: z.string().trim().max(254, t('withdrawalForm.validation.email')).pipe(z.email(t('withdrawalForm.validation.email'))),
		orderNumber: z.string().trim().toUpperCase().regex(/^(?:IND-)?[0-9]{10}$/, t('withdrawalForm.validation.orderNumber')),
		scope: z.enum(['all', 'selected'], { error: t('withdrawalForm.validation.scope') }),
		returnedProducts: z.string().trim().optional(),
		terms: z.boolean().refine(value => value === true, t('withdrawalForm.validation.terms')),
	}).superRefine((data, context) => {
		if (data.scope !== 'selected') return
		if (!data.returnedProducts) {
			context.addIssue({ code: 'custom', path: ['returnedProducts'], message: t('withdrawalForm.validation.returnedProducts') })
		} else if (data.returnedProducts.length > 2000) {
			context.addIssue({ code: 'custom', path: ['returnedProducts'], message: t('withdrawalForm.validation.returnedProductsMax') })
		}
	})
}

export type WithdrawalFormValues = z.infer<ReturnType<typeof createWithdrawalFormSchema>>
