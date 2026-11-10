import z from 'zod'
import { products } from '@/src/data/products'

export const COMPLAINT_PROBLEMS = ['damaged', 'wrongProduct', 'missingProduct', 'other'] as const
export const COMPLAINT_RESOLUTIONS = ['repair', 'replacement', 'refund'] as const

export function createComplaintFormSchema(t: (key: string) => string) {
	return z.object({
		firstName: z.string().trim().min(1, t('complaintForm.validation.firstName')).max(100, t('complaintForm.validation.nameMax'))
			.regex(/^[\p{L}\p{M}][\p{L}\p{M} .'\u2019-]*$/u, t('complaintForm.validation.nameInvalid')),
		lastName: z.string().trim().min(1, t('complaintForm.validation.lastName')).max(100, t('complaintForm.validation.nameMax'))
			.regex(/^[\p{L}\p{M}][\p{L}\p{M} .'\u2019-]*$/u, t('complaintForm.validation.nameInvalid')),
		email: z.string().trim().max(254, t('complaintForm.validation.email')).pipe(z.email(t('complaintForm.validation.email'))),
		orderNumber: z.string().trim().toUpperCase().regex(/^(?:IND-)?[0-9]{10}$/, t('complaintForm.validation.orderNumber')),
		product: z.enum(products.map(product => product.name), { error: t('complaintForm.validation.product') }),
		problem: z.enum(COMPLAINT_PROBLEMS, { error: t('complaintForm.validation.problem') }),
		description: z.string().trim().min(1, t('complaintForm.validation.description')).max(5000, t('complaintForm.validation.descriptionMax')),
		resolution: z.enum(COMPLAINT_RESOLUTIONS, { error: t('complaintForm.validation.resolution') }),
		terms: z.boolean().refine(value => value === true, t('complaintForm.validation.terms')),
	})
}

export type ComplaintFormValues = z.infer<ReturnType<typeof createComplaintFormSchema>>
