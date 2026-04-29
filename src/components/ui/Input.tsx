import { InputHTMLAttributes } from 'react'
import { FieldError, UseFormRegisterReturn } from 'react-hook-form'

interface InputType extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
	restClass?: string
	error?: FieldError | string | null
	message?: string | null
	formRegister?: UseFormRegisterReturn
	textarea?: boolean
	label?: string
}

function Input({ error, textarea = false, message, label, formRegister, ...rest }: InputType) {
	return (
		<div className="flex w-full flex-col">
			{label && (
				<label className="text-grayscale-500 mb-2 leading-6" htmlFor={rest.id}>
					{label}
				</label>
			)}
			<div className="relative w-full">
				{textarea ? (
					<textarea
						className={`disabled:opacity-50 placehoder:text-grayscale-500/50 w-full rounded-2xl border  bg-dark px-4 text-sm  resize-none placeholder:leading-6 placeholder:font-outfit outline-none transition-colors duration-300 leading-6 h-32  focus:border-grayscale-500 outline-grayscale-200 py-2  ${
							error ? 'border-alert text-alert' : 'border-grayscale-200 hover:border-grayscale-100'
						}`}
						{...formRegister}
						{...rest}
					/>
				) : (
					<input
						{...formRegister}
						{...rest}
						className={`disabled:opacity-50 placehoder:text-grayscale-500/50 w-full rounded-full border  bg-dark px-4 text-sm h-10 placeholder:leading-6 placeholder:font-outfit outline-none transition-colors duration-300  leading-6 focus:border-grayscale-500 outline-grayscale-200 py-2 ${
							error ? 'border-alert text-alert' : 'border-grayscale-200 hover:border-grayscale-100'
						}`}
					/>
				)}
			</div>

			{error && message && (
				<span className={`ml-0.5 mt-1 inline-block self-start text-xs  text-alert  `}>{message}</span>
			)}
		</div>
	)
}

export default Input
