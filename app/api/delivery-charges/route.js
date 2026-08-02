import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
export async function GET() { const now=new Date(); const charges=await prisma.deliveryCharge.findMany({orderBy:{zone:'asc'}}); return NextResponse.json({charges:charges.filter(x=>x.isEnabled).map(x=>({...x,amount:Number(x.scheduledAt&&x.scheduledAt<=now&&x.scheduledAmount!=null?x.scheduledAmount:x.amount)}))}); }
