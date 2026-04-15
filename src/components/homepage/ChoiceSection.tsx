import { getT } from '@/app/i18n'
import LinkButton from '../ui/LinkButton'
import Pill from '../ui/Pill'
import Image from 'next/image'

async function ChoiceSection({ lng }: { lng: string }) {
	const { t } = await getT('translations')
	return (
		<section className="pb-25 lg:pb-30">
			<div className="wrapper px-4 relative z-3  flex flex-col-reverse items-center gap-12 md:flex-row md:gap- md:justify-between">
				<div className="flex flex-col w-full items-center md:items-start md:w-fit">
					<div className=" flex flex-col items-center text-center mb-6  md:items-start md:text-left ">
						<Pill text={t('homepage.choice.pill')} />
						<h2 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4">
							{t('homepage.choice.title')} <br />
							{t('homepage.choice.titleTwo')}
						</h2>
						<p className="text-grayscale-500 leading-6 w-full max-w-[481px]">
							{t('homepage.choice.subtitle')}
						</p>
					</div>
					<LinkButton href={`${lng}/products`} variant="primary" restClass="w-fit">
						{t('homepage.choice.cta')}
						<svg
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
					</LinkButton>
				</div>
				<div className="relative z-3 pt-10 md:pt-0 mask-x-from-90% md:mask-x-from-80%">
					<Image
						className="hidden md:block "
						src={'/assets/choice-hero.png'}
						quality={100}
						width={477}
						height={674}
						alt="hand with beutifull nais"
						sizes="469px"
					/>
					<Image
						className="md:hidden block "
						src={'/assets/choice-hero-sm.png'}
						quality={100}
						width={287}
						height={404}
						alt="hand with beutifull nais"
						sizes="404px"
					/>
					<div className="absolute w-full bottom-0 left-0 h-25  bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#FFFFFF_100%)] z-4"></div>
				</div>
			</div>
		</section>
	)
}

export default ChoiceSection
