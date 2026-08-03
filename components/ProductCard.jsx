'use client'

import { Heart, StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
  const router = useRouter()
  const reviews = product.rating || []
  const rating = reviews.length ? Math.round(reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length) : 0
  const image = product.images?.[0]

  const addToWishlist = async (event) => {
    event.preventDefault()
    const response = await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) })
    const data = await response.json()
    if (response.status === 401) return router.push(`/login?redirect=${encodeURIComponent('/wishlist')}`)
    response.ok ? toast.success('Added to wishlist') : toast.error(data.message || data.error || 'Could not update wishlist')
  }

  return <article className='group relative max-xl:mx-auto'>
    <Link href={`/product/${product.slug || product.id}`} aria-label={`View ${product.name}`}>
    <div className='relative flex h-40 items-center justify-center overflow-hidden rounded-lg bg-[#F5F5F5] sm:h-68 sm:w-60'>
      {image ? <Image width={240} height={272} sizes='(max-width: 640px) 50vw, 240px' quality={80} className='max-h-30 sm:max-h-40 w-auto group-hover:scale-110 transition duration-300' src={image} alt={product.name} /> : <span className='text-sm text-slate-400'>No image</span>}
    </div>
    <div className='flex justify-between gap-3 text-sm text-slate-800 pt-2 max-w-60'>
      <div><p>{product.name}</p><div className='flex'>{Array(5).fill('').map((_, index) => <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={rating >= index + 1 ? '#00C950' : '#D1D5DB'} />)}</div></div>
      <p>{currency}{product.salePrice ?? product.price}</p>
    </div>
    </Link>
    <button type='button' onClick={addToWishlist} aria-label={`Add ${product.name} to wishlist`} className='absolute right-3 top-3 rounded-full bg-white p-2 text-slate-500 shadow-sm hover:text-red-500'><Heart aria-hidden='true' size={17} /></button>
  </article>
}
