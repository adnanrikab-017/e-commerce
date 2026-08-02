import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId, variantId } = action.payload
            const cartKey = variantId ? `${productId}:${variantId}` : productId
            if (state.cartItems[cartKey]) {
                state.cartItems[cartKey]++
            } else {
                state.cartItems[cartKey] = 1
            }
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const cartKey = action.payload.cartKey || action.payload.productId
            if (state.cartItems[cartKey]) {
                state.cartItems[cartKey]--
                if (state.cartItems[cartKey] === 0) {
                    delete state.cartItems[cartKey]
                }
            }
            state.total -= 1
        },
        deleteItemFromCart: (state, action) => {
            const cartKey = action.payload.cartKey || action.payload.productId
            state.total -= state.cartItems[cartKey] ? state.cartItems[cartKey] : 0
            delete state.cartItems[cartKey]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer
