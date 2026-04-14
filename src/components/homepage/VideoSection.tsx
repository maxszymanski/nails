import Image from 'next/image'

function VideoSection() {
	return (
		<section className="w-full px-4 mt-16 pb-25 lg:mt-32 lg:pb-30" data-aos="fade-in">
			<div className="w-full max-w-[1040px] mx-auto rounded-2xl md:rounded-[28px] overflow-hidden  border border-grayscale-400 p-1">
				<Image
					src={'/assets/video.png'}
					width={1040}
					height={584}
					alt="video"
					quality={100}
					className="rounded-[14px] md:rounded-3xl"
				/>
			</div>
		</section>
	)
}

export default VideoSection
