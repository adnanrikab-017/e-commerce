'use client'

import PageTitle from '@/components/PageTitle'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Orders() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
  const router = useRouter(); const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/orders', { cache: 'no-store' }).then((response) => {
      if (response.status === 401) { router.replace('/login?redirect=/orders'); return { orders: [] } }
      return response.json()
    }).then((data) => setOrders(data.orders || [])).finally(() => setLoading(false))
  }, [router])
  const submitReview = async (item) => { const rating = Number(prompt('Rating from 1 to 5:')); if (!Number.isInteger(rating) || rating < 1 || rating > 5) return alert('Enter a rating from 1 to 5'); const comment = prompt('Write your review:'); if (!comment?.trim()) return; const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderItemId: item.id, rating, comment }) }); const data = await response.json(); if (!response.ok) return alert(data.error); alert('Review submitted'); setOrders((list) => list.map((order) => ({ ...order, items: order.items.map((entry) => entry.id === item.id ? { ...entry, review: data.review } : entry) }))) }
  if (loading) return <div className='min-h-[70vh] grid place-items-center text-slate-500'>Loading orders...</div>
  return <div className='min-h-[70vh] mx-6'><div className='my-20 max-w-5xl mx-auto'><PageTitle heading='My Orders' text={`Showing total ${orders.length} orders`} linkText='Go to home' />
    {orders.length ? <div className='space-y-5'>{orders.map((order) => <article key={order.id} className='rounded-xl border border-slate-200 p-5 text-sm text-slate-600'>
      <div className='flex flex-wrap justify-between gap-3 border-b border-slate-100 pb-3'><div><b className='text-slate-800'>Order #{order.orderNumber}</b><p>{new Date(order.createdAt).toLocaleDateString()}</p></div><div className='text-right'><span className='rounded-full bg-slate-100 px-3 py-1'>{order.status}</span><p className='mt-2 font-semibold text-slate-800'>{currency}{Number(order.total).toFixed(2)}</p></div></div>
      <div className='divide-y divide-slate-100'>{order.items.map((item) => <div key={item.id} className='flex justify-between py-3'><span>{item.productName} × {item.quantity}</span><span>{currency}{(Number(item.unitPrice) * item.quantity).toFixed(2)}</span></div>)}</div>
      {order.address && <p className='border-t border-slate-100 pt-3'>Deliver to: {order.address.name}, {order.address.address}, {order.address.area}, {order.address.phone}</p>}
      {order.status === 'DELIVERED' && <div className='mt-3 flex flex-wrap gap-2'>{order.items.map((item) => item.review ? <span key={item.id} className='rounded bg-green-50 px-3 py-1 text-xs text-green-700'>Reviewed: {item.productName}</span> : <button key={item.id} onClick={() => submitReview(item)} className='rounded bg-slate-800 px-3 py-1 text-xs text-white'>Review {item.productName}</button>)}</div>}
    </article>)}</div> : <div className='min-h-[40vh] grid place-items-center text-2xl text-slate-400'>You have no orders</div>}
  </div></div>
}
