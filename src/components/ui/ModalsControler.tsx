'use client'

import useModalStore from '../stores/modalStore'
import CartModal from './CartModal'

function ModalsControler() {
	const openModal = useModalStore(state => state.openModal)
	const modalVersion = useModalStore(state => state.modalVersion)

	const modalMap: Record<string, React.ReactElement> = {
		cart: <CartModal key={modalVersion} />,
	}

	return typeof openModal === 'string' ? modalMap[openModal] || null : null
}

export default ModalsControler
