'use client'

import { addToCart } from '@/lib/features/cart/cartSlice'
import { CreditCardIcon, EarthIcon, StarIcon, TagIcon, UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Counter from './Counter'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'

export default function ProductDetails({ product }) {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
  const [mainImage, setMainImage] = useState(product.images?.[0])
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const cartKey = selectedVariantId ? `${product.id}:${selectedVariantId}` : product.id
  const quantityInCart = useSelector((state) => state.cart.cartItems[cartKey] || 0)
  const dispatch = useDispatch()
  const router = useRouter()
  useEffect(() => setMainImage(product.images?.[0]), [product])
  const reviews = product.rating || []
  const averageRating = reviews.length ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : 0
  const currentPrice = product.salePrice ?? product.price
  const savings = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0
  const selectedVariant = product.variants?.find((item) => item.id === selectedVariantId)
  const soldOut = product.variants?.length ? !selectedVariant || selectedVariant.isSoldOut || selectedVariant.stock < 1 : product.stock < 1

  return <div className='flex max-lg:flex-col gap-12'>
    <div className='flex max-sm:flex-col-reverse gap-3'>
      <div className='flex sm:flex-col gap-3'>{product.images?.map((image, index) => <button key={image} onClick={() => setMainImage(image)} className='bg-slate-100 flex items-center justify-center size-26 rounded-lg group'>{<Image src={image} className='max-h-20 w-auto group-hover:scale-105 transition' alt={`${product.name} ${index + 1}`} width={100} height={100} />}</button>)}</div>
      <div className='flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg'>{mainImage ? <Image src={mainImage} alt={product.name} width={300} height={300} className='max-h-80 w-auto' /> : <span className='text-slate-400'>No image</span>}</div>
    </div>
    <div className='flex-1'>
      <h1 className='text-3xl font-semibold text-slate-800'>{product.name}</h1>
      {product.shortDescription && <p className='mt-3 max-w-xl text-slate-500'>{product.shortDescription}</p>}
      <div className='flex items-center mt-2'>{Array(5).fill('').map((_, index) => <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? '#00C950' : '#D1D5DB'} />)}<p className='text-sm ml-3 text-slate-500'>{reviews.length} Reviews</p></div>
      <div className='flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800'><p>{currency}{currentPrice}</p>{product.salePrice != null && <p className='text-xl text-slate-500 line-through'>{currency}{product.price}</p>}</div>
      {savings > 0 && <div className='flex items-center gap-2 text-slate-500'><TagIcon size={14} /><p>Save {savings}% right now</p></div>}
      {product.variants?.length > 0 && <div className='mt-5'><p className='mb-2 font-medium text-slate-700'>Select size</p><div className='flex flex-wrap gap-2'>{product.variants.map((variant) => <button type='button' key={variant.id} disabled={variant.isSoldOut || variant.stock < 1} onClick={() => setSelectedVariantId(variant.id)} className={`rounded-lg border px-4 py-2 text-sm ${selectedVariantId === variant.id ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200'} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}>{variant.name}{(variant.isSoldOut || variant.stock < 1) && ' - Sold Out'}</button>)}</div></div>}
      <p className='mt-4 text-sm text-slate-500'>{selectedVariant ? `${selectedVariant.stock} in stock` : product.variants?.length ? 'Choose an available size' : product.stock > 0 ? `${product.stock} in stock` : 'Sold Out'}</p>
      <div className='flex items-end gap-5 mt-10'>{quantityInCart > 0 && <div className='flex flex-col gap-3'><p className='text-lg text-slate-800 font-semibold'>Quantity</p><Counter productId={product.id} variantId={selectedVariantId || null} max={selectedVariant?.stock ?? product.stock} /></div>}<button disabled={soldOut} onClick={() => { if (product.variants?.length && !selectedVariantId) return toast.error('Select a size first'); if (!quantityInCart) dispatch(addToCart({ productId: product.id, variantId: selectedVariantId || null })); else router.push('/cart') }} className='bg-slate-800 text-white px-10 py-3 text-sm font-medium rounded hover:bg-slate-900 disabled:opacity-50'>{soldOut && selectedVariantId ? 'Sold Out' : !quantityInCart ? 'Add to Cart' : 'View Cart'}</button></div>
      <hr className='border-gray-300 my-5' /><div className='flex flex-col gap-4 text-slate-500'><p className='flex gap-3'><EarthIcon className='text-slate-400' /> Fast delivery</p><p className='flex gap-3'><CreditCardIcon className='text-slate-400' /> Secured Payment</p><p className='flex gap-3'><UserIcon className='text-slate-400' /> Customer support</p></div>
    </div>
  </div>
}
