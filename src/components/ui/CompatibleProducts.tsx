'use client'
import { useT } from '@/app/i18n/client'
import { compatibleProducts } from '@/src/data/products'
import Image from 'next/image'
import Button from './Button'
import { useState } from 'react'
import { toast } from 'react-toastify'

function CompatibleProducts({ onClick }: { onClick?: () => void }) {
	const { t } = useT('translations')

	const [isCopying, setIsCopying] = useState(false)

	const handleCopy = async (value: string) => {
		if (isCopying) return

		try {
			await navigator.clipboard.writeText(value)
			toast.success(t('compatible.copiedToClipboard'))
			setIsCopying(true)

			setTimeout(() => {
				setIsCopying(false)
			}, 1000)
		} catch (error) {
			console.error('Błąd kopiowania:', error)
		}
	}

	return (
		<div className="lg:flex-1 min-h-0 lg:overflow-y-auto pt-4 lg:pt-6 flex flex-col gap-6 my-scrollbar">
			{compatibleProducts.map(product => (
				<div key={product.id} className="flex gap-6 w-full">
					<div className=" size-26 shrink-0 aspect-square relative overflow-hidden rounded-2xl  ">
						<Image
							src={product.image}
							alt={product.name}
							fill
							className="object-cover object-center "
							sizes="104px"
							loading="eager"
						/>
					</div>
					<div className="flex flex-col flex-1 min-w-0">
						<h3 className="leading-6  truncate w-full uppercase text-black-primary">{product.name}</h3>
						<p className="leading-6 text-grayscale-500">{t(`compatible.${product.lng}`)}</p>
						<div className="mt-auto w-full h-10 rounded-full flex items-center justify-center bg-grayscale-100 xs:px-4 px-2 sm:gap-4 gap-2">
							<p className="text-sm leading-5 text-grayscale-500">
								{t('compatible.article')} {product.id}
							</p>
							<Button
								variant="default"
								restClass="size-6 rounded-full hover:bg-grayscale-200 transition-colors"
								aria-label={t('compatible.copy')}
								title={t('compatible.copy')}
								onClick={() => handleCopy(product.id)}
								disabled={isCopying}>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg">
									<path
										d="M14.561 6.19837C14.3627 4.88602 13.4417 4 12.0538 4H7.55182C5.98455 4 5 5.14228 5 6.75592V12.7068C5 14.1768 5.81882 15.26 7.16133 15.4309"
										stroke="#565656"
										strokeWidth="1.25"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										fill-rule="evenodd"
										clip-rule="evenodd"
										d="M16.4478 8.54504H11.9473C10.3793 8.54504 9.39551 9.68422 9.39551 11.2971V17.248C9.39551 18.8608 10.374 20 11.9473 20H16.447C18.0212 20 18.9996 18.8608 18.9996 17.248V11.2971C18.9996 9.68422 18.0212 8.54504 16.4478 8.54504Z"
										stroke="#565656"
										strokeWidth="1.25"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</Button>
						</div>
					</div>
				</div>
			))}
			<div className="mt-auto w-full pt-6">
				<Button variant="primary" restClass="w-full " onClick={onClick}>
					<span className={` flex items-center `}>
						<svg
							className="rotate-180"
							width="20px"
							height="20px"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg">
							<g id="Arrow / Arrow_Right_SM">
								<path
									id="Vector"
									d="M7 12H17M17 12L13 8M17 12L13 16"
									stroke="#FFFFFF"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</g>
						</svg>
						{t('compatible.back')}
					</span>{' '}
				</Button>
			</div>
		</div>
	)
}

export default CompatibleProducts
