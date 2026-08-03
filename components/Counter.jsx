'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ productId, variantId, max = Infinity }) => {

    const cartKey = variantId ? `${productId}:${variantId}` : productId
    const quantity = useSelector(state => state.cart.cartItems[cartKey] || 0);

    const dispatch = useDispatch();

    const addToCartHandler = () => {
        if (quantity < max) dispatch(addToCart({ productId, variantId }))
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ cartKey }))
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button type="button" aria-label="Decrease quantity" onClick={removeFromCartHandler} className="p-1 select-none">−</button>
            <p className="p-1" aria-live="polite">{quantity}</p>
            <button type="button" aria-label="Increase quantity" onClick={addToCartHandler} className="p-1 select-none">+</button>
        </div>
    )
}

export default Counter
