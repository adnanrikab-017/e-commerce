'use client'

import ProductCard from '@/components/ProductCard'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const router = useRouter(); const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const load = () => fetch('/api/wishlist', { cache: 'no-store' }).then((response) => {
    if (response.status === 401) { router.replace('/login?redirect=/wishlist'); return { items: [] } }
    return response.json()
  }).then((data) => setItems(data.items || [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])
  const remove = async (productId) => {
    const response = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, { method: 'DELETE' })
    if (!response.ok) return toast.error('Could not remove item')
    setItems((list) => list.filter((item) => item.product.id !== productId)); toast.success('Removed from wishlist')
  }
  if (loading) return <div className='min-h-[70vh] grid place-items-center text-slate-500'>Loading wishlist...</div>
  return <div className='min-h-[70vh] max-w-7xl mx-auto px-6 py-12'><h1 className='text-2xl text-slate-700 font-semibold mb-8'>My Wishlist</h1>{items.length ? <div className='grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12'>{items.map(({ product }) => <div key={product.id}><ProductCard product={product} /><button onClick={() => remove(product.id)} className='mt-2 text-sm text-red-600 hover:underline'>Remove</button></div>)}</div> : <div className='min-h-[45vh] grid place-items-center text-2xl text-slate-400'>Your wishlist is empty</div>}</div>
}
