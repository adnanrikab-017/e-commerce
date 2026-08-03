'use client'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'
import { selectLatestProducts } from '@/lib/features/product/selectors'

const LatestProducts = () => {

    const displayQuantity = 4
    const products = useSelector(selectLatestProducts)

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <Title title='New Arrivals' description={`Showing ${products.length < displayQuantity ? products.length : displayQuantity} of ${products.length} products`} href='/shop?newArrival=true' />
            <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 justify-between'>
                {products.slice(0, displayQuantity).map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}

export default LatestProducts
