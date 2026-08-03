'use client'

import { assets } from '@/assets/assets'
import { ArrowRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import CategoriesMarquee from './CategoriesMarquee'

const fallback = { id: 'fallback', title: 'NEWS', subHeading: 'Free Shipping on Orders Above $50!', mainHeading: "Gadgets you'll love. Prices you'll trust.", description: 'Discover products selected for quality, value, and everyday usefulness.', offerText: '20% OFF', secondaryText: 'Best Products', buttonText: 'LEARN MORE', linkUrl: '/shop', imageUrl: assets.hero_model_img.src, mobileImageUrl: assets.hero_product_img1.src }

export default function Hero() {
  const [banners, setBanners] = useState([]); const [active, setActive] = useState(0); const [loading, setLoading] = useState(true)
  const load = useCallback(() => fetch('/api/banners', { cache: 'no-store' }).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => { setBanners(data.banners || []); setActive(0) }).catch(() => setBanners([])).finally(() => setLoading(false)), [])
  useEffect(() => { load(); window.addEventListener('gocart:hero-changed', load); return () => window.removeEventListener('gocart:hero-changed', load) }, [load])
  useEffect(() => { if (banners.length < 2) return; const timer = setInterval(() => setActive((index) => (index + 1) % banners.length), 7000); return () => clearInterval(timer) }, [banners.length])
  const banner = banners[active] || fallback
  return <div className='mx-6'>
    <section aria-busy={loading} className='relative mx-auto my-10 min-h-[430px] max-w-7xl overflow-hidden rounded-3xl bg-green-100 shadow-sm'>
      <Image key={banner.imageUrl} src={banner.imageUrl} alt='' fill priority sizes='(max-width: 768px) 100vw, 1280px' quality={80} className='object-cover transition-opacity duration-500' />
      <div className='absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent'/>
      <div className='relative z-10 flex min-h-[430px] max-w-2xl flex-col justify-center p-6 sm:p-14'>
        <div className='mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-green-100/90 p-1 pr-4 text-xs text-green-800 sm:text-sm'><span className='rounded-full bg-green-600 px-3 py-1 text-white'>{banner.title || 'NEWS'}</span>{banner.subHeading}<ChevronRight size={16}/></div>
        <h1 className='max-w-xl text-3xl font-semibold leading-tight text-slate-800 sm:text-5xl'>{banner.mainHeading}</h1>
        <p className='mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:text-base'>{banner.description}</p>
        <div className='mt-5 flex flex-wrap gap-2'><span className='rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700'>{banner.offerText}</span><span className='rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700'>{banner.secondaryText}</span></div>
        <Link href={banner.linkUrl || '/shop'} className='mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-slate-800 px-7 py-3 text-sm font-medium text-white transition hover:bg-slate-900'>{banner.buttonText}<ArrowRight size={17}/></Link>
      </div>
      {banner.mobileImageUrl && <div className='absolute bottom-0 right-3 hidden h-[78%] w-[36%] lg:block'><Image src={banner.mobileImageUrl} alt='' fill sizes='36vw' quality={80} className='object-contain object-bottom'/></div>}
      {banners.length > 1 && <div className='absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2'>{banners.map((item, index) => <button key={item.id} onClick={() => setActive(index)} aria-label={`Show banner ${index + 1}`} className={`h-2 rounded-full transition-all ${index === active ? 'w-8 bg-green-600' : 'w-2 bg-slate-400'}`}/>)}</div>}
    </section>
    <CategoriesMarquee />
  </div>
}
