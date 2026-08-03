import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const Title = ({ title, description, visibleButton = true, href = '' }) => {

    return (
        <div className='flex flex-col items-center'>
            <h2 className='text-2xl font-semibold text-slate-800'>{title}</h2>
            <p className='mt-2 max-w-lg text-center text-sm text-slate-600'>{description}</p>
            {visibleButton && <Link href={href || '/shop'} className='mt-3 flex items-center gap-1 text-sm text-green-600'>View more <ArrowRight aria-hidden='true' size={14} /></Link>}
        </div>
    )
}

export default Title
