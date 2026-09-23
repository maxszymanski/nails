'use client'
import { Slide, ToastContainer } from 'react-toastify'

function Toaster() {
	return (
		<ToastContainer
			position="top-right"
			autoClose={2000}
			hideProgressBar={false}
			newestOnTop
			closeOnClick={false}
			rtl={false}
			pauseOnFocusLoss
			transition={Slide}
			toastClassName="!bg-white !text-grayscale-500 rounded-xl shadow-lg  !font-outfit"
			icon={false}
		/>
	)
}

export default Toaster
