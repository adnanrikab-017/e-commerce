'use client'

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CategoriesMarquee() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    fetch('/api/categories', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : { categories: [] })
      .then((data) => setCategories(data.categories || []));
  }, []);
  if (!categories.length) return null;
  return <div className="overflow-hidden w-full relative max-w-7xl mx-auto select-none group sm:my-20">
    <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
    <div className="flex min-w-[200%] animate-[marqueeScroll_40s_linear_infinite] group-hover:[animation-play-state:paused] gap-4">
      {[...categories, ...categories].map((category, index) => <Link key={`${category.id}-${index}`} href={`/shop?category=${encodeURIComponent(category.slug)}`} className="px-5 py-2 bg-slate-100 rounded-lg text-slate-500 text-xs sm:text-sm hover:bg-slate-600 hover:text-white transition-all">{category.name}</Link>)}
    </div>
    <div className="absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
  </div>;
}
