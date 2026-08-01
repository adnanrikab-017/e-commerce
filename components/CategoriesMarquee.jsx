'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export default function CategoriesMarquee() {
  const [categories, setCategories] = useState([])
  const trackRef = useRef(null); const groupRef = useRef(null); const state = useRef({ x: 0, last: 0, paused: false, dragging: false, pointerX: 0 })
  useEffect(() => { fetch('/api/categories', { cache: 'no-store' }).then((response) => response.ok ? response.json() : { categories: [] }).then((data) => setCategories(data.categories || [])) }, [])
  useEffect(() => {
    let frame
    const tick = (time) => { const item = state.current; if (!item.last) item.last = time; if (!item.paused && !item.dragging && groupRef.current) { item.x -= Math.min(time - item.last, 32) * .045; const width = groupRef.current.offsetWidth; if (width && -item.x >= width) item.x += width } item.last = time; if (trackRef.current) trackRef.current.style.transform = `translate3d(${item.x}px,0,0)`; frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [categories])
  if (!categories.length) return null
  const group = (suffix, ref) => <div ref={ref} className='flex shrink-0 gap-4 pr-4'>{categories.map((category) => <Link draggable='false' key={`${category.id}-${suffix}`} href={`/shop?category=${encodeURIComponent(category.slug)}`} className='shrink-0 rounded-lg bg-slate-100 px-5 py-2 text-xs text-slate-600 transition hover:bg-slate-700 hover:text-white sm:text-sm'>{category.name}</Link>)}</div>
  return <div className='group relative mx-auto my-12 w-full max-w-7xl overflow-hidden select-none sm:my-20' onMouseEnter={() => { state.current.paused = true }} onMouseLeave={() => { state.current.paused = false }} onPointerDown={(event) => { state.current.dragging = true; state.current.pointerX = event.clientX; event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={(event) => { if (!state.current.dragging) return; state.current.x += event.clientX - state.current.pointerX; state.current.pointerX = event.clientX }} onPointerUp={(event) => { state.current.dragging = false; event.currentTarget.releasePointerCapture(event.pointerId) }}>
    <div className='absolute left-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent'/><div ref={trackRef} className='flex w-max will-change-transform'>{group('a', groupRef)}{group('b')}</div><div className='absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent'/>
  </div>
}
