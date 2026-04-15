'use client'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import Image from 'next/image'

function CarouselBox() {
	const [emblaRef] = useEmblaCarousel(
		{
			loop: true,
			dragFree: true,
		},
		[
			AutoScroll({
				speed: 0.7,
				stopOnInteraction: false,
				stopOnMouseEnter: false,
			}),
		],
	)

	return (
		<div
			className="mx-auto w-full max-w-[2650px] select-none overflow-x-hidden active:cursor-grabbing lg:cursor-grab lg:pb-40 pb-25 mask-x-from-85%"
			ref={emblaRef}>
			<div className="flex w-full items-center">
				<CardImage src="/assets/carousel/three.png" alt="carousel image 2" />
				<CardImage src="/assets/carousel/two.png" alt="carousel image 1" large />
				<CardImage src="/assets/carousel/one.png" alt="carousel image 1" large />
				<CardImage src="/assets/carousel/three.png" alt="carousel image 2" />
				<CardImage src="/assets/carousel/four.png" alt="carousel image 1" large />
				<CardImage src="/assets/carousel/two.png" alt="carousel image 1" large />
				<CardImage src="/assets/carousel/three.png" alt="carousel image 2" />
				<CardImage src="/assets/carousel/one.png" alt="carousel image 1" large />
				<CardImage src="/assets/carousel/three.png" alt="carousel image 2" />
				<CardImage src="/assets/carousel/four.png" alt="carousel image 1" large />
			</div>
		</div>
	)
}

const CardImage = ({ src, large = false, alt }: { src: string; large?: boolean; alt: string }) => {
	return (
		<div
			className={`${large ? 'w-[286px] lg:w-[480px]' : ' lg:w-[300px] w-[179px]'} relative rounded-2xl lg:rounded-3xl overflow-hidden shrink-0 lg:h-[420px] h-[250px] mx-2`}>
			<Image src={src} alt={alt} fill className="object-cover object-center" sizes={large ? '480px' : '300px'} />
		</div>
	)
}

export default CarouselBox
