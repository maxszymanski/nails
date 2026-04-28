'use client'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

function MobileCarousel({ images }: { images: string[] }) {
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
	const [selectedIndex, setSelectedIndex] = useState(0)

	const onSelect = useCallback(() => {
		if (!emblaApi) return
		setSelectedIndex(emblaApi.selectedScrollSnap())
	}, [emblaApi])

	useEffect(() => {
		if (!emblaApi) return
		emblaApi.on('select', onSelect)
		return () => {
			emblaApi.off('select', onSelect)
		}
	}, [emblaApi, onSelect])

	const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi])

	return (
		<div className="flex flex-col gap-4 ">
			<div className="w-full flex flex-col gap-3 lg:max-w-[542px] md:flex-row lg:flex-col">
				<div
					className="overflow-hidden rounded-2xl lg:rounded-3xl aspect-square w-full md:max-w-[542px] md:max-h-[542px]"
					ref={emblaRef}>
					<div className="flex h-full">
						{images.map((src, i) => (
							<div
								key={i}
								className="flex-[0_0_100%] relative aspect-square md:max-w-[542px] md:max-h-[542px] overflow-hidden cursor-grab">
								<Image
									src={src}
									alt={`Product image ${i + 1}`}
									fill
									className="object-cover"
									sizes="542px"
									quality={100}
									fetchPriority="high"
									loading="eager"
								/>
							</div>
						))}
					</div>
				</div>

				<div className="gap-2 justify-center  md:hidden flex">
					{images.map((src, i) => (
						<button
							key={src}
							onClick={() => scrollTo(i)}
							className={`relative w-8 block h-1 shrink-0 rounded-full duration-300 transition-colors ${
								selectedIndex === i ? 'bg-my-purple' : 'bg-grayscale-100'
							}`}></button>
					))}
				</div>
				<div className="gap-2 justify-between  hidden md:flex md:flex-col lg:flex-row">
					{images.map((src, i) =>
						i === selectedIndex ? null : (
							<button
								key={src}
								onClick={() => scrollTo(i)}
								className={`relative w-42.5 h-42.5 shrink-0 rounded-2xl lg:rounded-3xl overflow-hidden cursor-pointer hover:brightness-95 transition-all duration-300`}>
								<Image
									src={src}
									alt={`Thumbnail ${i + 1}`}
									fill
									className="object-cover"
									sizes="170px"
									quality={100}
									fetchPriority="high"
									loading="eager"
								/>
							</button>
						),
					)}
				</div>
			</div>
		</div>
	)
}

export default MobileCarousel
