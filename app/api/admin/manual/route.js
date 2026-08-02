import { requireAdmin } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { createPdf } from '@/lib/simple-pdf';

const topics = ['Login','Dashboard Overview','Category Management','Brand Management','Product Management','Product Variants','Stock Management','Hero Banner Management','Orders','Customers','Coupons','Delivery Charges','Reviews','Reports','PDF Export','Notifications','User Management','Settings','Troubleshooting','Frequently Asked Questions (FAQ)'];

export async function GET() {
  if (!(await requireAdmin())) return apiError('Unauthorized', 401);
  const sections = [{ heading: 'Table of Contents', lines: topics.map((topic, index) => `${index + 1}. ${topic}`) }];
  topics.forEach((heading, index) => {
    const lines = [
      `Step 1: Open the ${heading} area from the administrator navigation.`,
      'Step 2: Review the records and use the available create, edit, filter, or export controls.',
      'Step 3: Confirm important changes. A success message confirms the database update.',
      'Screenshot placeholder: Insert a current screen capture here when branding or layout changes.',
    ];
    if (index === 5) lines.push('Add one row per size, enter its stock, and use Sold Out to disable a size manually.');
    if (index === 8) lines.push('When an order is cancelled, GoCart restores product and variant inventory automatically.');
    if (index === 11) lines.push('Inside Dhaka defaults to BDT 60 and Outside Dhaka to BDT 120.');
    sections.push({ heading, lines });
  });
  return new Response(createPdf('GoCart Admin User Manual', sections), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="GoCart_Admin_User_Manual.pdf"' } });
}
