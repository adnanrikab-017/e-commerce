'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function PublicLayout({ children }) {

    return (
        <>
            <Banner />
            <Navbar />
            <main className="pb-18 md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
        </>
    );
}
