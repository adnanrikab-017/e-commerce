'use client'

import { cropAndCompressImage, ACCEPTED_IMAGE_TYPES } from '@/lib/client-image'
import { ImagePlus, UploadCloud, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

export default function ImageUploader({ value = [], onChange, multiple = false, maxFiles = 1, aspect = 'square', label = 'Image', required = false }) {
  const inputRef = useRef(null)
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [preview, setPreview] = useState('')
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!current) return setPreview('')
    const url = URL.createObjectURL(current)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [current])

  useEffect(() => {
    if (!current && queue.length) {
      setCurrent(queue[0])
      setQueue((items) => items.slice(1))
      setZoom(1); setOffsetX(0); setOffsetY(0)
    }
  }, [current, queue])

  const acceptFiles = (files) => {
    const available = maxFiles - value.length
    const selected = [...files].filter((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) { toast.error(`${file.name}: use JPG, PNG, or WebP`); return false }
      if (file.size > 15 * 1024 * 1024) { toast.error(`${file.name}: maximum source size is 15 MB`); return false }
      return true
    }).slice(0, multiple ? available : 1)
    if (selected.length) setQueue((items) => [...items, ...selected])
  }

  const processAndUpload = async () => {
    setUploading(true)
    try {
      const landscape = aspect === 'landscape'
      const processed = await cropAndCompressImage(current, { width: landscape ? 1600 : 1000, height: landscape ? 900 : 1000, zoom, offsetX, offsetY })
      const payload = new FormData(); payload.append('files', processed)
      const response = await fetch('/api/admin/uploads', { method: 'POST', body: payload })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')
      onChange(multiple ? [...value, ...data.images].slice(0, maxFiles) : data.images)
      toast.success('Image optimized and uploaded')
      setCurrent(null)
    } catch (error) { toast.error(error.message || 'Could not process image') }
    finally { setUploading(false) }
  }

  return <div className='space-y-3'>
    <div className='flex items-center justify-between'><span className='text-xs font-medium'>{label}{required && <span className='text-red-500'> *</span>}</span><span className='text-xs text-slate-400'>{value.length}/{maxFiles}</span></div>
    {value.length < maxFiles && <button type='button' onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); acceptFiles(event.dataTransfer.files) }} className='w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-green-500 hover:bg-green-50 transition'>
      <UploadCloud className='mx-auto mb-2 text-slate-400' /><span className='block text-sm font-medium'>Drop {multiple ? 'images' : 'an image'} here or browse</span><span className='text-xs text-slate-500'>JPG, PNG or WebP · automatically resized and compressed</span>
    </button>}
    <input ref={inputRef} hidden type='file' accept={ACCEPTED_IMAGE_TYPES.join(',')} multiple={multiple} onChange={(event) => { acceptFiles(event.target.files); event.target.value = '' }} />
    {!!value.length && <div className='flex flex-wrap gap-3'>{value.map((image, index) => <div key={image.publicId || image.url} className='relative'><img src={image.url} alt='' className='size-24 rounded-lg border object-cover' /><button type='button' aria-label='Remove image' onClick={() => onChange(value.filter((_, i) => i !== index))} className='absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white'><X size={13} /></button>{index === 0 && multiple && <span className='absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white'>Cover</span>}</div>)}</div>}
    {current && <div className='fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4'><div className='w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl'>
      <div className='mb-4 flex items-center justify-between'><div><h3 className='font-semibold'>Crop and resize</h3><p className='text-xs text-slate-500'>Adjust framing before compression and upload.</p></div><button type='button' onClick={() => setCurrent(null)}><X /></button></div>
      <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${aspect === 'landscape' ? 'aspect-video' : 'aspect-square max-h-[45vh]'}`}><img src={preview} alt='Crop preview' className='h-full w-full select-none object-cover' style={{ transform: `scale(${zoom}) translate(${offsetX / zoom}%, ${offsetY / zoom}%)` }} /></div>
      <div className='mt-4 grid gap-3 sm:grid-cols-3'>{[['Zoom', zoom, 1, 2.5, .05, setZoom], ['Horizontal', offsetX, -100, 100, 1, setOffsetX], ['Vertical', offsetY, -100, 100, 1, setOffsetY]].map(([name, val, min, max, step, setter]) => <label key={name} className='text-xs'>{name}<input className='mt-1 w-full accent-green-600' type='range' value={val} min={min} max={max} step={step} onChange={(e) => setter(Number(e.target.value))} /></label>)}</div>
      <div className='mt-5 flex justify-end gap-3'><button type='button' onClick={() => setCurrent(null)} className='rounded-lg border px-4 py-2 text-sm'>Cancel</button><button type='button' disabled={uploading} onClick={processAndUpload} className='inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm text-white disabled:opacity-60'><ImagePlus size={16}/>{uploading ? 'Processing…' : 'Use image'}</button></div>
    </div></div>}
  </div>
}
