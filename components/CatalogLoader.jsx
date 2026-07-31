'use client'

import { setProduct } from '@/lib/features/product/productSlice'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

export default function CatalogLoader() {
  const dispatch = useDispatch()
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/products', { cache: 'no-store', signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Catalog request failed')))
      .then((data) => dispatch(setProduct(data.products || [])))
      .catch((error) => { if (error.name !== 'AbortError') dispatch(setProduct([])) })
    return () => controller.abort()
  }, [dispatch])
  return null
}
