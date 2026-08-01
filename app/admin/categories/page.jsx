'use client'

import ImageUploader from '@/components/admin/ImageUploader'
import { fetchJson } from '@/lib/client-http'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const emptyCategory = { name: '', images: [], isFeatured: false }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyCategory)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try { const data = await fetchJson('/api/admin/categories', { cache: 'no-store' }); setCategories(data.categories || []) }
    catch (error) { toast.error(error.message || 'Could not load categories') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async (event) => {
    event.preventDefault()
    if (!form.images[0]) return toast.error('A category image is required')
    setSaving(true)
    try {
      const image = form.images[0]
      const data = await fetchJson('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, imageUrl: image.url, imagePublicId: image.publicId, isFeatured: form.isFeatured }) })
      setCategories((items) => [data.category, ...items]); setForm(emptyCategory)
      window.dispatchEvent(new CustomEvent('gocart:categories-changed', { detail: data.category }))
      toast.success('Category created and available for products')
    } catch (error) { toast.error(error.message || 'Could not create category') } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this category and its Cloudinary image?')) return
    try { await fetchJson(`/api/admin/categories?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); setCategories((items) => items.filter((item) => item.id !== id)); toast.success('Category deleted') }
    catch (error) { toast.error(error.message || 'Could not delete category') }
  }

  return <div className='mb-20 max-w-6xl text-slate-700'>
    <div className='mb-6'><p className='text-sm font-medium text-green-700'>Catalog Organization</p><h1 className='text-3xl font-semibold'>Categories</h1></div>
    <div className='grid gap-8 lg:grid-cols-[360px_1fr]'>
      <form onSubmit={save} className='h-fit space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='border-b pb-3 text-lg font-semibold'>Add Category</h2>
        <label className='block text-xs font-medium'>Category Name<input required minLength={2} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className='mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm' placeholder='e.g. Electronics'/></label>
        <ImageUploader label='Category image' required value={form.images} onChange={(images) => setForm({ ...form, images })} />
        <label className='flex items-center gap-2 text-sm'><input type='checkbox' checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}/> Featured category</label>
        <button disabled={saving} className='w-full rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white disabled:opacity-60'>{saving ? 'Creating…' : 'Create Category'}</button>
      </form>
      <div className='overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm'><table className='w-full text-left text-sm'><thead className='bg-slate-50'><tr>{['Image','Name','Products','Featured','Actions'].map((item) => <th key={item} className='px-4 py-3.5'>{item}</th>)}</tr></thead><tbody className='divide-y'>{loading ? <tr><td colSpan='5' className='p-8 text-center'>Loading…</td></tr> : !categories.length ? <tr><td colSpan='5' className='p-8 text-center text-slate-500'>No categories yet.</td></tr> : categories.map((category) => <tr key={category.id}><td className='px-4 py-3'><img src={category.imageUrl} alt='' className='size-12 rounded-lg object-cover'/></td><td className='px-4 py-3'><p className='font-medium'>{category.name}</p><p className='text-xs text-slate-400'>{category.slug}</p></td><td className='px-4 py-3'>{category._count?.products || 0}</td><td className='px-4 py-3'>{category.isFeatured ? 'Yes' : 'No'}</td><td className='px-4 py-3'><button onClick={() => remove(category.id)} className='text-red-600' title='Delete'><Trash2 size={17}/></button></td></tr>)}</tbody></table></div>
    </div>
  </div>
}
