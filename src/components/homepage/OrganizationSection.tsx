import { getT } from '@/app/i18n'
import Pill from '../ui/Pill'
import Image from 'next/image'
import LinkButton from '../ui/LinkButton'
import CarouselBox from './CarouselBox'

async function OrganizationSection({ lng }: { lng: string }) {
	const { t } = await getT('translations')

	return (
		<>
			<section className="py-25 lg:py-30">
				<div className="w-full max-w-[1200px] mx-auto flex flex-col gap-12 lg:gap-20">
					<div className="flex flex-col w-full items-center">
						<div className=" flex flex-col items-center text-center mb-6  max-w-[575px]" data-aos="fade-in">
							<Pill text={t('homepage.organization.pill')} />
							<h2 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 ">
								{t('homepage.organization.title')}
							</h2>
							<p className="text-grayscale-500 leading-6 w-full ">
								{t('homepage.organization.subtitle')}
							</p>
						</div>
					</div>
					<div className="h-[180px] max-w-[600px] relative sm:h-[360px] sm:max-w-[1200px] w-full">
						<Image
							src={'/assets/organization-hero.png'}
							quality={100}
							fill
							alt="nails organizer"
							className="object-cover object-center "
							sizes="(max-width: 640px) 600px, 1200px"
							data-aos="fade-in"
						/>
					</div>
				</div>
			</section>
			<section>
				<div className="max-w-[749px] mx-auto w-full pb-12 lg:pb-14 px-4">
					<div className="flex flex-col w-full items-center">
						<div className=" flex flex-col items-center text-center mb-6  " data-aos="fade-in">
							<Pill text={t('homepage.upgrade.pill')} />
							<h2 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4 tracking-shrink">
								{t('homepage.upgrade.title')}
							</h2>
							<p className="text-grayscale-500 leading-6 w-full max-w-[472px]">
								{t('homepage.upgrade.subtitle')}
							</p>
						</div>
						<LinkButton href={`${lng}/products`} variant="primary" restClass="w-fit" data-aos="fade-in">
							{t('homepage.upgrade.cta')}
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
				<CarouselBox />
			</section>
		</>
	)
}

export default OrganizationSection
