import { getT } from '@/app/i18n'
import Pill from '../ui/Pill'
import Image from 'next/image'
import LinkButton from '../ui/LinkButton'

async function OptionsSection({ lng }: { lng: string }) {
	const { t } = await getT('translations')
	return (
		<section className="w-full bg-[#231F2D] py-12 lg:py-16">
			<div className="wrapper px-4 flex flex-col gap-12 lg:gap-14">
				<div className="flex flex-col w-full items-center">
					<div className=" flex flex-col items-center text-center mb-6  max-w-[575px]">
						<Pill text={t('homepage.options.pill')} />
						<h2 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 text-white">
							{t('homepage.options.title')}
						</h2>
						<p className="text-[#BCBCBC] leading-6 w-full ">{t('homepage.options.subtitle')}</p>
					</div>
				</div>

				<div className="w-full flex flex-col gap-4 items-center">
					<div className="w-full flex flex-col gap-4 md:flex-row items-center">
						<div className="w-full max-w-[343px] h-[343px] md:h-[300px] md:max-w-full  md:basis-[calc(100%/2 -8px)]">
							<Card
								title={t('homepage.options.frame')}
								subtitle={t('homepage.options.frameSub')}
								smallImage="/assets/option-one-sm.png"
								image="/assets/option-one.png"
								alt="frame version"
								cta={t('homepage.options.frameCta')}
								href={`${lng}/products/frame`}
							/>
						</div>
						<div className="w-full max-w-[343px] h-[343px] md:h-[300px] md:max-w-full  md:basis-[calc(100%/2 -8px)]">
							<Card
								title={t('homepage.options.cabinet')}
								subtitle={t('homepage.options.cabinetSub')}
								smallImage="/assets/option-one-sm.png"
								image="/assets/option-one.png"
								alt="cabinet version"
								cta={t('homepage.options.cabinetCta')}
								href={`${lng}/products/cabinet`}
							/>
						</div>
					</div>
					<div className="w-full max-w-[343px] h-[343px] md:h-[300px]  lg:basis-[calc(100%/2 -8px)] md:max-w-full ">
						<Card
							title={t('homepage.options.display')}
							subtitle={t('homepage.options.displaySub')}
							smallImage="/assets/option-three-sm.png"
							image="/assets/option-three.png"
							alt="display bar"
							cta={t('homepage.options.displayCta')}
							href={`${lng}/products/display-bar`}
							isDisplay
						/>
					</div>
				</div>
			</div>
		</section>
	)
}

const Card = async ({
	title,
	subtitle,
	smallImage,
	image,
	isDisplay,
	alt,
	href,
	cta,
}: {
	title: string
	subtitle: string
	smallImage: string
	image: string
	isDisplay?: boolean
	alt: string
	href: string
	cta: string
}) => {
	const { t } = await getT('translations')
	return (
		<div className="relative bg-white z-3 h-full w-full  rounded-2xl overflow-hidden  lg:rounded-3xl">
			<div className="flex flex-col  items-center md:items-start p-4 max-w-[255px] md:max-w-full w-full mx-auto  z-4  gap-2 md:p-6">
				<div className="text-center md:text-start md:relative md:z-3">
					<h3 className="capitalize leading-7 text-[18px] lg:text-xl lg:leading-8 inline-flex items-center gap-2">
						{title}
						{isDisplay && (
							<Pill
								text={t('homepage.options.new')}
								restClass="absolute bottom-4 right-4 md:relative z-5 md:bottom-0 md:right-0"
							/>
						)}
					</h3>
					<p
						className={`text-grayscale-500 leading-5 text-sm lg:text-base lg:leading-6 ${!isDisplay ? 'md:max-w-[226px]' : ''}`}>
						{subtitle}
					</p>
				</div>
			</div>
			<Image
				className={'object-bottom pointer-events-none md:hidden'}
				src={smallImage}
				fill
				alt={alt}
				quality={100}
				sizes="343px"
			/>
			<Image
				className="object-bottom-right pointer-events-none hidden md:block"
				src={image}
				fill
				alt={alt}
				quality={100}
				sizes={`${isDisplay ? '1140px' : '562px'}`}
			/>
			<div className="absolute bottom-0 w-full h-12 z-4 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#FFFFFF_100%)] lg:h-25"></div>
			<div className="hidden md:block absolute z-5 bottom-6 left-6">
				<LinkButton href={href} variant="secondary">
					{cta}
					<svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g id="Arrow / Arrow_Right_SM">
							<path
								id="Vector"
								d="M7 12H17M17 12L13 8M17 12L13 16"
								stroke="#565656"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</g>
					</svg>
				</LinkButton>
			</div>
		</div>
	)
}

export default OptionsSection
