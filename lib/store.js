import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './features/cart/cartSlice'
import productReducer from './features/product/productSlice'

export const makeStore = () => {
    return configureStore({
        reducer: {
            cart: cartReducer,
            product: productReducer,
        },
    })
}
