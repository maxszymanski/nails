function VideoSection() {
	return (
		// <section className="w-full px-4 mt-16 pb-25 lg:mt-32 lg:pb-30" data-aos="fade-in">
		// 	<div className="w-full max-w-[1040px] mx-auto rounded-2xl md:rounded-[28px] overflow-hidden  border border-grayscale-400 p-1">
		// 		<Image
		// 			src={'/assets/video.png'}
		// 			width={1040}
		// 			height={584}
		// 			alt="video"
		// 			quality={100}
		// 			className="rounded-[14px] md:rounded-3xl"
		// 		/>
		// 	</div>
		// </section>
		<section className="w-full px-4 mt-16 pb-25 lg:mt-32 lg:pb-30" data-aos="fade-in">
			<div className="w-full max-w-[1040px] mx-auto rounded-2xl md:rounded-[28px] overflow-hidden border border-grayscale-400 p-1">
				<video
					controls
					preload="metadata"
					poster="/assets/poster.png"
					className="w-full aspect-[1040/584] object-cover rounded-[14px] md:rounded-3xl">
					<source src="/assets/large.mp4" type="video/mp4" />
				</video>
			</div>
		</section>
	)
}

export default VideoSection
