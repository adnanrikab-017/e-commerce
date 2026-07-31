'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import CatalogLoader from "@/components/CatalogLoader";

export default function PublicLayout({ children }) {

    return (
        <>
            <CatalogLoader />
            <Banner />
            <Navbar />
            <main className="pb-18 md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
        </>
    );
}
