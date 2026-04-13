'use client'

import { ReactNode, useEffect } from 'react'
import Aos from 'aos'
import 'aos/dist/aos.css'

function AosProvider({ children }: { children: ReactNode }) {
	useEffect(() => {
		Aos.init({
			duration: 1000,
			once: true,
			delay: 50,
		})
	}, [])

	return <>{children}</>
}

export default AosProvider
