'use client'

import { XIcon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function AddressModal({ setShowAddressModal, onSaved, initialAddress = null }) {
  const [address, setAddress] = useState(initialAddress || { name: '', phone: '', address: '', area: '', isDefault: false })
  const [saving, setSaving] = useState(false)
  const handleSubmit = async (event) => {
    event.preventDefault(); setSaving(true)
    try {
      const response = await fetch('/api/addresses', { method: initialAddress ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(address) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || 'Could not save address')
      onSaved?.(data.address); toast.success('Address saved'); setShowAddressModal(false)
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }
  return <div className='fixed inset-0 z-50 bg-white/60 backdrop-blur flex items-center justify-center p-6'>
    <form onSubmit={handleSubmit} className='relative flex flex-col gap-5 text-slate-700 w-full max-w-sm bg-white p-6 rounded-xl shadow-xl border border-slate-200'>
      <h2 className='text-2xl'>{initialAddress ? 'Edit' : 'Add New'} <span className='font-semibold'>Address</span></h2>
      <input name='name' onChange={(e) => setAddress({ ...address, name: e.target.value })} value={address.name} className='p-2 px-4 border border-slate-200 rounded' placeholder='Recipient name' required />
      <input name='phone' onChange={(e) => setAddress({ ...address, phone: e.target.value })} value={address.phone} className='p-2 px-4 border border-slate-200 rounded' placeholder='Phone' required />
      <textarea name='address' onChange={(e) => setAddress({ ...address, address: e.target.value })} value={address.address} className='p-2 px-4 border border-slate-200 rounded min-h-24' placeholder='Street address' required />
      <input name='area' onChange={(e) => setAddress({ ...address, area: e.target.value })} value={address.area} className='p-2 px-4 border border-slate-200 rounded' placeholder='Area / city' required />
      <label className='flex gap-2 items-center text-sm'><input type='checkbox' checked={address.isDefault} onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })} /> Default address</label>
      <button disabled={saving} className='bg-slate-800 text-white text-sm font-medium py-2.5 rounded-md disabled:opacity-50'>{saving ? 'Saving...' : 'SAVE ADDRESS'}</button>
      <button type='button' aria-label='Close' className='absolute top-4 right-4 text-slate-500' onClick={() => setShowAddressModal(false)}><XIcon size={24} /></button>
    </form>
  </div>
}
