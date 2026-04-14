import { getT } from '@/app/i18n'
import Image from 'next/image'
import LinkButton from '../ui/LinkButton'

async function HomeHeader({ lng }: { lng: string }) {
	const { t } = await getT('translations')

	return (
		<section className="2xl:max-w-[1172px] xl:mx-auto mt-22 lg:mt-22 flex w-full flex-col items-center md:flex-row justify-center md:justify-end md:items-start relative overflow-hidden max-w-screen 2xl:overflow-visible">
			<Image
				src={'/assets/home-hero-sm.png'}
				quality={100}
				width={350}
				height={400}
				alt="Colorful nail polishes in various shades displayed on a box with the Iwon brand logo"
				priority
				fetchPriority="high"
				loading="eager"
				className="md:hidden block object-top mask-x-from-90%"
			/>
			<Image
				src={'/assets/home-hero.png'}
				quality={100}
				width={1048}
				height={734}
				alt="Colorful nail polishes in various shades displayed on a box with the Iwon brand logo"
				priority
				fetchPriority="high"
				loading="eager"
				className="hidden md:block -mt-8 relative md:-right-30 lg:-right-40"
			/>
			<div className="md:absolute md:inset-0 lg:w-full">
				<div className="md:max-w-[1172px] lg:mx-auto h-full px-4 ">
					<div className="flex flex-col gap-4 items-center md:items-start lg:gap-6 md:pt-24 text-center md:text-left max-w-[480px] md:max-w-[540px]">
						<h1 className="leading-12 text-[40px] md:text-5xl md:leading-14 lg:text-[64px] lg:leading-18">
							{t('homepage.header.title')} <br />
							{t('homepage.header.titleTwo')}
						</h1>
						<p className="text-grayscale-500 leading-6 w-full md:pr-20 lg:pr-15">
							{t('homepage.header.subtitle')}
						</p>
						<LinkButton href={`${lng}/products`} variant="primary" restClass="w-fit">
							{t('homepage.header.cta')}
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
				</div>
			</div>
		</section>
	)
}

export default HomeHeader
