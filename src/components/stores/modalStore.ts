import { create } from 'zustand'

type ModalType = 'cart'

type ModalStore = {
	openModal: ModalType | null
	modalVersion: number
	setOpenModal: (modalType: ModalType) => void
	closeModal: () => void
	show: boolean
	setShow: (show: boolean) => void
}

const useModalStore = create<ModalStore>()(set => ({
	openModal: null,
	modalVersion: 0,
	setOpenModal: modalType => set(state => ({ openModal: modalType, modalVersion: state.modalVersion + 1 })),
	closeModal: () => set({ openModal: null }),
	show: true,
	setShow: show => set({ show }),
}))

export default useModalStore
