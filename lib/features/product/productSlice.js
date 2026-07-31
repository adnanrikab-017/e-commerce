import { createSlice } from '@reduxjs/toolkit'

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        loaded: false,
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload
            state.loaded = true
        },
        clearProduct: (state) => {
            state.list = []
            state.loaded = true
        }
    }
})

export const { setProduct, clearProduct } = productSlice.actions

export default productSlice.reducer
