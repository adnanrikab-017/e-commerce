'use client'
import { Search, ShoppingCart, Heart, User, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const Navbar = () => {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const cartCount = useSelector(state => state.cart?.total || 0);

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                setUser(data.user);
            })
            .catch(() => setUser(null))
            .finally(() => setLoadingUser(false));
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        router.push(`/shop?search=${search}`);
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            toast.success("Logged out successfully");
            router.push("/login");
            router.refresh();
        } catch {
            toast.error("Failed to log out");
        }
    };

    return (
        <nav className="relative bg-white">
            <div className="mx-4 sm:mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">

                    <Link href="/" aria-label="GoCart home" className="relative text-3xl font-semibold text-slate-700 sm:text-4xl">
                        <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-6 text-slate-600">
                        <Link href="/">Home</Link>
                        <Link href="/shop">Shop</Link>
                        <Link href="/shop">New arrivals</Link>

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

                        {!loadingUser && (
                            user ? (
                                <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                                    {user.role === "ADMIN" && (
                                        <Link href="/admin" className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-800 text-white rounded-full hover:bg-slate-900 transition">
                                            <ShieldCheck size={14} /> Admin
                                        </Link>
                                    )}
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                        <User size={18} className="text-green-600" />
                                        <span className="max-w-[100px] truncate">{user.name || "Account"}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        title="Log out"
                                        className="text-slate-500 hover:text-red-600 transition p-1 cursor-pointer"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 border-l border-slate-200 pl-4 text-sm">
                                    <Link href="/login" className="px-3 py-1.5 font-medium text-slate-700 hover:text-green-600">
                                        Login
                                    </Link>
                                    <Link href="/register" className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition">
                                        Register
                                    </Link>
                                </div>
                            )
                        )}

                    </div>

                    {/* Mobile User / Auth Button */}
                    <div className="sm:hidden flex items-center gap-3">
                        <Link href="/cart" aria-label="Cart" className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                            <ShoppingCart size={19} />
                            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-green-600 text-[9px] text-white">{cartCount}</span>
                        </Link>
                        {user ? (
                            <button onClick={handleLogout} className="p-2 text-slate-600 hover:text-red-600" title="Log out">
                                <LogOut size={20} />
                            </button>
                        ) : (
                            <Link href="/login" className="text-xs font-semibold px-3 py-2 bg-green-600 text-white rounded-full">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            <hr className="border-gray-300" />
        </nav>
    )
}

export default Navbar

