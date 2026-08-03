import dynamic from 'next/dynamic'
import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import LatestProducts from "@/components/LatestProducts";

const OurSpecs = dynamic(() => import('@/components/OurSpec'))
const Newsletter = dynamic(() => import('@/components/Newsletter'))

export default function Home() {
    return (
        <div>
            <Hero />
            <LatestProducts />
            <BestSelling />
            <OurSpecs />
            <Newsletter />
        </div>
    );
}
