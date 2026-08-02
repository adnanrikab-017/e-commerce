import { requireAdmin } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { createPdf } from '@/lib/simple-pdf';

export async function GET(_request, { params }) {
  if (!(await requireAdmin())) return apiError('Unauthorized', 401);
  const { type } = await params;
  let sections;
  if (type === 'customers') {
    const rows = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, include: { _count: { select: { orders: true } } }, orderBy: { createdAt: 'desc' } });
    sections = [{ heading: 'Customers', lines: ['Name | Contact | Orders | Status', ...rows.map((row) => `${row.name} | ${row.email || row.phone || '-'} | ${row._count.orders} | ${row.isActive ? 'Active' : 'Disabled'}`), `Total customers: ${rows.length}`] }];
  } else if (type === 'orders') {
    const rows = await prisma.order.findMany({ include: { customer: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
    const revenue = rows.filter((row) => row.status === 'DELIVERED').reduce((sum, row) => sum + Number(row.total), 0);
    sections = [{ heading: 'Orders', lines: ['Order | Customer | Status | Total', ...rows.map((row) => `${row.orderNumber} | ${row.customer.name} | ${row.status} | BDT ${row.total}`), `Total orders: ${rows.length} | Delivered revenue: BDT ${revenue.toFixed(2)}`] }];
  } else if (type === 'dashboard') {
    const [orders, customers, products] = await Promise.all([prisma.order.count(), prisma.user.count({ where: { role: 'CUSTOMER' } }), prisma.product.count()]);
    sections = [{ heading: 'Dashboard Summary', lines: [`Orders: ${orders}`, `Customers: ${customers}`, `Products: ${products}`] }];
  } else return apiError('Unknown report type', 404);
  return new Response(createPdf(`GoCart ${type[0].toUpperCase() + type.slice(1)} Report`, sections), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="gocart-${type}-report.pdf"` } });
}
