import { create } from 'zustand'

type ModalType = 'cart'

type ModalStore = {
	openModal: ModalType | null
	setOpenModal: (modalType: ModalType) => void
	closeModal: () => void
	show: boolean
	setShow: (show: boolean) => void
}

const useModalStore = create<ModalStore>()(set => ({
	openModal: null,
	setOpenModal: modalType => set({ openModal: modalType }),
	closeModal: () => set({ openModal: null }),
	show: true,
	setShow: show => set({ show }),
}))

export default useModalStore
