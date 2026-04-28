import { getT } from '@/app/i18n'
import LinkButton from '../ui/LinkButton'
import Pill from '../ui/Pill'
import Image from 'next/image'

async function ProductsSection({ lng }: { lng: string }) {
	const { t } = await getT('translations')

	return (
		<section className="bg-[#F8F2EA]  py-12 lg:py-16 relative z-0 overflow-hidden">
			<svg
				width="847"
				height="750"
				viewBox="0 0 847 750"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="absolute top-0 right-0 z-1">
				<path
					opacity="0.2"
					d="M1123.76 -671.311C1123.76 -671.961 1123.76 -671.961 1123.76 -671.311C681.368 -855.954 199.577 -704.469 46.5143 -333.882C-105.902 36.7038 128.535 487.259 570.285 671.252C573.514 672.552 577.39 674.502 581.265 675.803C1020.43 853.294 1495.76 701.809 1647.54 333.823C1800.6 -37.4133 1565.51 -487.318 1123.76 -671.311ZM1247.76 166.084C1247.76 166.734 1247.76 166.734 1247.76 166.084C1223.87 224.598 1196.1 278.56 1164.45 327.972C1010.1 575.029 778.243 708.96 595.473 641.345C592.243 640.044 588.369 638.744 585.14 637.444C400.431 560.726 327.452 296.114 392.681 6.14685C405.598 -51.0665 423.681 -109.58 447.577 -167.444C523.785 -352.737 764.681 -428.154 985.556 -335.833C1206.43 -244.162 1323.97 -19.209 1247.76 166.084ZM1302.66 -7.50635C1280.06 -157.041 1167.68 -300.075 999.765 -369.641C831.848 -439.857 651.66 -418.402 530.889 -329.331C688.473 -580.94 925.494 -715.521 1110.2 -638.153C1294.26 -561.435 1367.89 -297.474 1302.66 -7.50635Z"
					fill="#E9DDC8"
				/>
			</svg>
			<svg
				width="848"
				height="751"
				viewBox="0 0 848 751"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="absolute bottom-0 left-0 z-1">
				<path
					opacity="0.2"
					d="M276.764 78.689C276.764 78.0388 276.764 78.0388 276.764 78.689C-165.632 -105.954 -647.423 45.5312 -800.486 416.118C-952.902 786.704 -718.465 1237.26 -276.715 1421.25C-273.485 1422.55 -269.61 1424.5 -265.735 1425.8C173.431 1603.29 648.764 1451.81 800.535 1083.82C953.598 712.587 718.514 262.682 276.764 78.689ZM400.764 916.084C400.764 916.734 400.764 916.734 400.764 916.084C376.868 974.598 349.098 1028.56 317.452 1077.97C163.098 1325.03 -68.7566 1458.96 -251.527 1391.34C-254.757 1390.04 -258.631 1388.74 -261.86 1387.44C-446.569 1310.73 -519.548 1046.11 -454.319 756.147C-441.402 698.934 -423.319 640.42 -399.423 582.556C-323.215 397.263 -82.3191 321.846 138.556 414.167C359.431 505.839 476.972 730.791 400.764 916.084Z"
					fill="#E9DDC8"
				/>
			</svg>

			<div className="wrapper px-4 relative z-3">
				<div
					className="flex flex-col w-full items-center md:flex-row md:items-end md:justify-between md:gap-4"
					data-aos="fade-in">
					<div className=" flex flex-col items-center text-center mb-6 md:mb-0 md:items-start md:text-left">
						<Pill text={t('homepage.products.pill')} />
						<h2 className=" leading-12 text-[40px] md:text-5xl md:leading-14   mt-2 mb-4">
							{t('homepage.products.title')} <br />
							{t('homepage.products.titleTwo')}
						</h2>
						<p className="text-grayscale-500 leading-6 w-full max-w-[550px]">
							{t('homepage.products.subtitle')}
						</p>
					</div>
					<LinkButton href={`${lng}/produkte`} variant="primary" restClass="w-fit">
						{t('homepage.products.cta')}
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
				<ProductsBoxes />
			</div>
		</section>
	)
}

const ProductsBoxes = async () => {
	const { t } = await getT('translations')

	return (
		<div
			className="flex flex-row flex-wrap justify-center gap-4 mt-12 lg:gap-x-[15px] 
    lg:grid lg:grid-cols-[1fr_1fr_1fr] lg:grid-rows-[1fr_1fr] lg:h-[616px] lg:mt-14">
			<div className="w-full max-w-[343px] h-[343px] lg:max-w-none lg:h-auto lg:row-span-4 " data-aos="fade-in">
				<ProductsBox
					title={t('homepage.products.organizers')}
					subtitle={t('homepage.products.organizersSub')}
					smallImage="/assets/organizer-sm.png"
					image="/assets/organizer.png"
					alt="organizer"
				/>
			</div>

			<div className="w-full max-w-[343px] h-[343px] lg:max-w-none  lg:h-auto lg:row-span-2" data-aos="fade-in">
				<ProductsBox
					title={t('homepage.products.magnetic')}
					subtitle={t('homepage.products.magneticSub')}
					smallImage="/assets/magnetic-sm.png"
					image="/assets/magnetic.png"
					alt="magnetic tips"
				/>
			</div>

			<div className="w-full max-w-[343px] h-[343px] lg:max-w-none lg:h-auto lg:row-span-2" data-aos="fade-in">
				<ProductsBox
					title={t('homepage.products.nonmagnetic')}
					subtitle={t('homepage.products.nonmagneticSub')}
					smallImage="/assets/nonmagnetic-sm.png"
					image="/assets/nonmagnetic.png"
					alt="non magnetic tips"
				/>
			</div>

			<div
				className="w-full max-w-[343px] h-[343px]  lg:max-w-none lg:h-[300px] lg:col-span-2 lg:row-span-2 lg:col-start-2 lg:row-start-3"
				data-aos="fade-in">
				<ProductsBox
					title={t('homepage.products.display')}
					subtitle={t('homepage.products.displaySub')}
					smallImage="/assets/display-sm.png"
					image="/assets/display.png"
					alt="Proffesional Presentation"
					isDisplay
				/>
			</div>
		</div>
	)
}
const ProductsBox = ({
	title,
	subtitle,
	smallImage,
	image,
	isDisplay,
	alt,
}: {
	title: string
	subtitle: string
	smallImage: string
	image: string
	isDisplay?: boolean
	alt: string
}) => {
	return (
		<div className="relative bg-white z-3 h-full w-full  rounded-2xl overflow-hidden shadow-[0px_1px_2px_0px_#E9DDC840,0px_2px_8px_0px_#E9DDC840] lg:rounded-3xl">
			<div className="flex flex-col  items-center p-4 max-w-[287px] lg:max-w-full w-full mx-auto relative z-4 lg:flex-row gap-2 lg:pl-4 lg:pr-2 lg:gap-4 lg:mx-0 xl:pl-6">
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M6.65361 9.58672C6.65361 7.96711 7.96591 6.65483 9.58551 6.65353H10.9198C11.694 6.65353 12.4357 6.3462 12.9855 5.80157L13.9179 4.86793C15.0603 3.71904 16.9172 3.71385 18.0661 4.85497L18.0673 4.85627L18.0791 4.86664L19.0127 5.80028C19.5612 6.3462 20.3043 6.65223 21.0784 6.65223H22.4153C24.0349 6.65223 25.3485 7.96581 25.3485 9.58543V10.9185C25.3485 11.6939 25.6545 12.4356 26.2004 12.9854L27.1341 13.919C28.2829 15.0615 28.2895 16.9183 27.1484 18.0673L26.2017 19.0139C25.6559 19.5625 25.3499 20.3054 25.3499 21.0783V22.4165C25.3472 24.0361 24.0336 25.3458 22.4153 25.3445H21.0757C20.3016 25.3445 19.5587 25.6518 19.0101 26.1978L18.0765 27.1301C16.9367 28.2803 15.0797 28.2881 13.9308 27.1482L13.9269 27.1457L12.9829 26.2017C12.4344 25.6557 11.6914 25.3497 10.9173 25.3485H9.58551C7.96591 25.3485 6.65361 24.0361 6.65361 22.4165V21.0757C6.65361 20.3015 6.34629 19.5598 5.80037 19.0113L4.86803 18.0777C3.71783 16.9378 3.71005 15.0835 4.84857 13.9333C4.84857 13.9333 4.85247 13.9307 4.85376 13.9282L5.79777 12.9828C6.34369 12.4343 6.65103 11.6913 6.65103 10.9159V9.58672"
						stroke="#725FFF"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M12.0051 16.1631L14.6414 18.8032L20.072 13.3699"
						stroke="#725FFF"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				<div className="text-center lg:text-start">
					<h3 className="capitalize leading-7 text-[18px] lg:text-xl lg:leading-8 ">{title}</h3>
					<p className="text-grayscale-500 leading-5 text-sm lg:text-base lg:leading-6">{subtitle}</p>
				</div>
			</div>
			<Image
				className="object-bottom pointer-events-none lg:hidden"
				src={smallImage}
				fill
				alt={alt}
				quality={100}
				sizes="343px"
			/>
			<Image
				className="object-bottom pointer-events-none hidden lg:block"
				src={image}
				fill
				alt={alt}
				quality={100}
				sizes={`${isDisplay ? '755px' : '370px'}`}
			/>
			<div className="absolute bottom-0 w-full h-12 z-4 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#FFFFFF_100%)] lg:h-25"></div>
		</div>
	)
}

export default ProductsSection
