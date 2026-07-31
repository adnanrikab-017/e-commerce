'use client'

import { StarIcon } from 'lucide-react'
import { useState } from 'react'

export default function ProductDescription({ product }) {
  const [selectedTab, setSelectedTab] = useState('Description')
  const specifications = product.specifications && typeof product.specifications === 'object' ? Object.entries(product.specifications) : []
  const reviews = product.rating || []
  return <div className='my-18 text-sm text-slate-600'>
    <div className='flex border-b border-slate-200 mb-6 max-w-2xl'>{['Description', 'Specifications', 'Reviews'].map((tab) => <button className={`${tab === selectedTab ? 'border-b-[1.5px] font-semibold' : 'text-slate-400'} px-3 py-2 font-medium`} key={tab} onClick={() => setSelectedTab(tab)}>{tab}</button>)}</div>
    {selectedTab === 'Description' && <div className='max-w-2xl whitespace-pre-wrap leading-6'>{product.description || product.shortDescription || 'No description available.'}</div>}
    {selectedTab === 'Specifications' && (specifications.length ? <dl className='max-w-2xl divide-y divide-slate-200 border-y border-slate-200'>{specifications.map(([key, value]) => <div key={key} className='grid grid-cols-3 gap-4 py-3'><dt className='font-medium text-slate-700'>{key}</dt><dd className='col-span-2'>{value}</dd></div>)}</dl> : <p>No specifications available.</p>)}
    {selectedTab === 'Reviews' && (reviews.length ? <div className='flex flex-col gap-8'>{reviews.map((item, index) => <div key={index}><div className='flex'>{Array(5).fill('').map((_, star) => <StarIcon key={star} size={18} className='text-transparent' fill={item.rating >= star + 1 ? '#00C950' : '#D1D5DB'} />)}</div><p className='my-2'>{item.review}</p><p className='font-medium text-slate-800'>{item.user?.name || 'Customer'}</p></div>)}</div> : <p>No reviews yet.</p>)}
  </div>
}
