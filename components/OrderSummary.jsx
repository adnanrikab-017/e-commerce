'use client'

import { Pencil, PlusIcon, Trash2, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import AddressModal from './AddressModal'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { clearCart } from '@/lib/features/cart/cartSlice'
import { fetchJson } from '@/lib/client-http'

export default function OrderSummary({ totalPrice, items }) {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
  const router = useRouter(); const dispatch = useDispatch()
  const [addresses, setAddresses] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [couponCodeInput, setCouponCodeInput] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [charges, setCharges] = useState([])
  const [deliveryZone, setDeliveryZone] = useState('INSIDE_DHAKA')
  const loadAddresses = async () => {
    try {
      const data = await fetchJson('/api/addresses', { cache: 'no-store' }); const list = data.addresses || []
      setAddresses(list); setSelectedAddressId((current) => current || list.find((item) => item.isDefault)?.id || list[0]?.id || '')
    } catch (error) {
      if (error.status !== 401) toast.error(error.message || 'Could not load addresses')
    }
  }
  useEffect(() => { loadAddresses(); fetch('/api/delivery-charges', { cache: 'no-store' }).then((r) => r.json()).then((d) => { setCharges(d.charges || []); if (d.charges?.length) setDeliveryZone(d.charges[0].zone) }) }, [])
  const applyCoupon = async (event) => {
    event.preventDefault()
    const response = await fetch('/api/coupons/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCodeInput, subtotal: totalPrice }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || data.error || 'Coupon is not valid')
    setCoupon({ ...data.coupon, discountAmount: data.discountAmount }); toast.success('Coupon applied')
  }
  const deleteAddress = async (id) => {
    const response = await fetch(`/api/addresses?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); const data = await response.json()
    if (!response.ok) return toast.error(data.message || data.error || 'Could not delete address')
    setAddresses((list) => list.filter((item) => item.id !== id)); if (selectedAddressId === id) setSelectedAddressId('')
  }
  const placeOrder = async () => {
    if (!selectedAddressId) return toast.error('Select a delivery address')
    setPlacing(true)
    try {
      await fetchJson('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod,
          couponCode: coupon?.code || null,
          deliveryZone,
          items: items.map((item) => ({ productId: item.id, variantId: item.variantId, quantity: item.quantity })),
        }),
      })
      dispatch(clearCart()); toast.success('Order placed successfully'); router.push('/orders')
    } catch (error) {
      if (error.status === 401) return router.push('/login?redirect=/cart')
      toast.error(error.message || 'Order could not be placed')
    } finally { setPlacing(false) }
  }
  const discount = coupon?.discountAmount || 0
  const deliveryCharge = Number(charges.find((item) => item.zone === deliveryZone)?.amount || 0)
  return <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
    <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2><p className='text-slate-400 text-xs my-4'>Payment Method</p>
    {['COD', 'BKASH', 'NAGAD'].map((method) => <label key={method} className='flex gap-2 items-center mt-1'><input type='radio' name='payment' onChange={() => setPaymentMethod(method)} checked={paymentMethod === method} />{method}</label>)}
    <div className='mt-4'><p>Delivery area</p>{charges.map((charge) => <label key={charge.zone} className='mt-1 flex items-center gap-2'><input type='radio' checked={deliveryZone === charge.zone} onChange={() => setDeliveryZone(charge.zone)} />{charge.label} ({currency}{Number(charge.amount).toFixed(0)})</label>)}</div>
    <div className='my-4 py-4 border-y border-slate-200'><p>Address</p>{addresses.length > 0 && <div className='space-y-2 my-3'>{addresses.map((address) => <label key={address.id} className='flex items-start gap-2 border border-slate-200 rounded p-2'><input type='radio' name='address' checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} /><span className='flex-1'>{address.name}, {address.address}, {address.area}, {address.phone}{address.isDefault && <b className='ml-1'>(Default)</b>}</span><button type='button' title='Edit address' onClick={() => { setEditingAddress(address); setShowAddressModal(true) }}><Pencil size={15} /></button><button type='button' title='Delete address' onClick={() => deleteAddress(address.id)}><Trash2 size={15} /></button></label>)}</div>}<button type='button' className='flex items-center gap-1 text-slate-600' onClick={() => { setEditingAddress(null); setShowAddressModal(true) }}>Add Address <PlusIcon size={18} /></button></div>
    <div className='pb-4 border-b border-slate-200'><div className='flex justify-between'><div><p>Subtotal:</p><p>Shipping:</p>{coupon && <p>Coupon:</p>}</div><div className='text-right font-medium'><p>{currency}{totalPrice.toFixed(2)}</p><p>Free</p>{coupon && <p>-{currency}{discount.toFixed(2)}</p>}</div></div>
      {!coupon ? <form onSubmit={(event) => toast.promise(applyCoupon(event), { loading: 'Checking coupon...' })} className='flex gap-3 mt-3'><input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} required placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full' /><button className='bg-slate-600 text-white px-3 rounded'>Apply</button></form> : <div className='flex items-center justify-center gap-2 text-xs mt-2'><span>Code: <b>{coupon.code}</b></span><button onClick={() => setCoupon(null)}><XIcon size={18} /></button></div>}
    </div>
    <div className='flex justify-between py-4'><p>Total:</p><p className='font-medium'>{currency}{Math.max(0, totalPrice - discount + deliveryCharge).toFixed(2)}</p></div>
    <button disabled={placing} onClick={placeOrder} className='w-full bg-slate-700 text-white py-2.5 rounded disabled:opacity-50'>{placing ? 'Placing order...' : 'Place Order'}</button>
    {showAddressModal && <AddressModal initialAddress={editingAddress} setShowAddressModal={setShowAddressModal} onSaved={(address) => { setAddresses((list) => [address, ...list.filter((item) => item.id !== address.id).map((item) => address.isDefault ? { ...item, isDefault: false } : item)]); setSelectedAddressId(address.id); setEditingAddress(null) }} />}
  </div>
}
