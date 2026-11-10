import { z } from 'zod'
import { createWithdrawalFormSchema } from './withdrawal-form'
import { createComplaintFormSchema } from './complaint-form'

export const customerRequestAttemptSchema = z.object({
	requestId: z.uuid(),
	createdAt: z.iso.datetime(),
})

const metadata = {
	...customerRequestAttemptSchema.shape,
	lng: z.enum(['pl', 'en', 'de']),
}

export const customerRequestSchema = z.discriminatedUnion('kind', [
	z.strictObject({ ...metadata, kind: z.literal('withdrawal'), data: createWithdrawalFormSchema(key => key) }),
	z.strictObject({ ...metadata, kind: z.literal('complaint'), data: createComplaintFormSchema(key => key) }),
])

export type CustomerRequest = z.infer<typeof customerRequestSchema>
