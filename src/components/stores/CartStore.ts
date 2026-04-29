import { Product } from '@/src/data/products'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
	id: number
	name: string
	slug: string
	price: number
	image: string
	quantity: number
}

interface CartStore {
	items: CartItem[]
	addItem: (product: Product, quantity?: number) => void
	increase: (id: number) => void
	decrease: (id: number) => void
	remove: (id: number) => void
	clearCart: () => void
}

export const useCartStore = create<CartStore>()(
	persist(
		set => ({
			items: [],

			addItem: (product, quantity = 1) =>
				set(state => {
					const exists = state.items.find(i => i.id === product.id)
					if (exists) {
						return {
							items: state.items.map(i =>
								i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
							),
						}
					}
					return {
						items: [
							...state.items,
							{
								id: product.id,
								name: product.name,
								slug: product.slug,
								price: product.price,
								image: product.images[0],
								quantity,
							},
						],
					}
				}),

			increase: id =>
				set(state => ({
					items: state.items.map(i => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i)),
				})),

			decrease: id =>
				set(state => ({
					items: state.items.map(i => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i)),
				})),

			remove: id =>
				set(state => ({
					items: state.items.filter(i => i.id !== id),
				})),

			clearCart: () => set({ items: [] }),
		}),
		{
			name: 'cart',
			storage: createJSONStorage(() => sessionStorage),
			partialize: state => ({ items: state.items }),
		},
	),
)
