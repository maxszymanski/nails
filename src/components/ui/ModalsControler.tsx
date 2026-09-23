'use client'

import useModalStore from '../stores/modalStore'
import CartModal from './CartModal'

function ModalsControler() {
	const openModal = useModalStore(state => state.openModal)

	const modalMap: Record<string, React.ReactElement> = {
		cart: <CartModal />,
	}

	return typeof openModal === 'string' ? modalMap[openModal] || null : null
}

export default ModalsControler
