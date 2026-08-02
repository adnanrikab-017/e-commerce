'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ productId, variantId, max = Infinity }) => {

    const { cartItems } = useSelector(state => state.cart);

    const dispatch = useDispatch();

    const addToCartHandler = () => {
        const cartKey = variantId ? `${productId}:${variantId}` : productId
        if ((cartItems[cartKey] || 0) < max) dispatch(addToCart({ productId, variantId }))
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ cartKey: variantId ? `${productId}:${variantId}` : productId }))
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button onClick={removeFromCartHandler} className="p-1 select-none">-</button>
            <p className="p-1">{cartItems[variantId ? `${productId}:${variantId}` : productId]}</p>
            <button onClick={addToCartHandler} className="p-1 select-none">+</button>
        </div>
    )
}

export default Counter
