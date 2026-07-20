'use client';

import Link from "next/link";
import { Heart, Home, Search, ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Search },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"><div className="mx-auto grid max-w-lg grid-cols-4">{links.map(({ href, label, icon: Icon }) => { const active = href === "/" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={`flex min-h-15 flex-col items-center justify-center gap-1 text-xs ${active ? "text-green-700" : "text-slate-500"}`}><Icon size={20} aria-hidden="true" strokeWidth={active ? 2.5 : 2} />{label}</Link>; })}</div></nav>;
}
