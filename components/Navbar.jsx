'use client'
import { Search, ShoppingCart, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";

const Navbar = () => {

    const router = useRouter();

    const [search, setSearch] = useState('')
    const cartCount = useSelector(state => state.cart.total)

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/shop?search=${search}`)
    }

    return (
        <nav className="relative bg-white">
            <div className="mx-4 sm:mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4  transition-all">

                    <Link href="/" aria-label="GoCart home" className="relative text-3xl font-semibold text-slate-700 sm:text-4xl">
                        <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
                        <Link href="/">Home</Link>
                        <Link href="/shop">Shop</Link>
                        <Link href="/shop">New arrivals</Link>
                        <Link href="/shop">Best sellers</Link>

                        <form onSubmit={handleSearch} className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full">
                            <Search size={18} className="text-slate-600" />
                            <input className="w-full bg-transparent outline-none placeholder-slate-600" type="text" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} required />
                        </form>

                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600">
                            <ShoppingCart size={18} />
                            Cart
                            <span className="absolute -top-1 left-3 grid size-3.5 place-items-center text-[8px] text-white bg-slate-600 rounded-full">{cartCount}</span>
                        </Link>
                        <Link href="/wishlist" aria-label="Wishlist"><Heart size={20} /></Link>

                    </div>

                    {/* Mobile User Button  */}
                    <div className="sm:hidden">
                        <Link href="/cart" aria-label="Cart" className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                            <ShoppingCart size={19} />
                            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-green-600 text-[9px] text-white">{cartCount}</span>
                        </Link>
                    </div>
                </div>
            </div>
            <hr className="border-gray-300" />
        </nav>
    )
}

export default Navbar
