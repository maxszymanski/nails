import { FieldError } from 'react-hook-form'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
	name: string
	label?: React.ReactNode
	labelClass?: string
	required?: boolean
	error?: FieldError | string | null
	formRegister?: object
	message?: string | null
	wrapperClass?: string
}

function Checkbox({
	name,
	label,
	labelClass = '',
	formRegister = {},
	error,
	message,
	wrapperClass,
	...rest
}: CheckboxProps) {
	return (
		<div className={`${wrapperClass ?? ''} flex w-full flex-col`}>
			<label className={`inline-flex items-center`} htmlFor={name}>
				<span className="relative flex cursor-pointer items-center">
					<input
						type="checkbox"
						name={name}
						id={name}
						{...rest}
						{...formRegister}
						className={`peer h-4 w-4 cursor-pointer appearance-none rounded border bg-white transition-all ${error ? 'checked:border-grayscale-200 rounded-sm border-red-500' : 'border-grayscale-200  checked:bg-white '}`}
					/>
					<span className="text-dark pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-3 w-3"
							viewBox="0 0 20 20"
							fill="#725fff"
							stroke="#725fff"
							strokeWidth="1">
							<path
								fillRule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clipRule="evenodd"
							/>
						</svg>
					</span>
				</span>
				{label && (
					<span
						className={`text-grayscale-500 ml-3 cursor-pointer leading-5 text-sm first-letter:uppercase ${labelClass ?? ''} hover:text-black-primary/80 select-none transition-colors duration-300`}>
						{label}
					</span>
				)}
			</label>
			{error && (
				<span className="ml-0.5 mt-2 inline-block self-start text-xs font-light text-alert lg:mt-1">
					{message}
				</span>
			)}
		</div>
	)
}

export default Checkbox
