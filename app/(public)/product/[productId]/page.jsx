'use client'

import ProductDescription from '@/components/ProductDescription'
import ProductDetails from '@/components/ProductDetails'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ProductPage() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    fetch(`/api/products/${encodeURIComponent(productId)}`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setProduct(data.product))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
    window.scrollTo(0, 0)
  }, [productId])
  if (loading) return <div className='min-h-[60vh] grid place-items-center text-slate-500'>Loading product...</div>
  if (!product) return <div className='min-h-[60vh] grid place-items-center text-slate-500'>Product not found.</div>
  return <div className='mx-6'><div className='max-w-7xl mx-auto'>
    <div className='text-gray-600 text-sm mt-8 mb-5'>Home / Products / {product.category?.name}</div>
    <ProductDetails product={product} />
    <ProductDescription product={product} />
  </div></div>
}
