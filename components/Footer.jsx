import Link from "next/link";

const footerLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Track order", href: "/orders" },
  { label: "Cart", href: "/cart" },
];

export default function Footer() {
  return <footer className="mx-4 border-t border-slate-200 bg-white sm:mx-6"><div className="mx-auto grid max-w-7xl gap-8 py-10 sm:grid-cols-[1.5fr_1fr]"><div><Link href="/" className="text-3xl font-semibold text-slate-700"><span className="text-green-600">go</span>cart<span className="text-green-600">.</span></Link><p className="mt-4 max-w-md text-sm leading-6 text-slate-500">Thoughtfully chosen products, transparent delivery, and responsive support.</p></div><nav aria-label="Footer" className="flex flex-wrap content-start gap-x-6 gap-y-3 text-sm text-slate-600">{footerLinks.map((link) => <Link key={link.href} href={link.href} className="hover:text-green-700 hover:underline">{link.label}</Link>)}</nav></div><p className="mx-auto max-w-7xl border-t border-slate-100 py-4 text-xs text-slate-500">Copyright © {new Date().getFullYear()} GoCart. All rights reserved.</p></footer>;
}
