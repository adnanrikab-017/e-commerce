import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "GoCart. - Admin",
    description: "GoCart. - Admin",
};

export default async function RootAdminLayout({ children }) {
    const admin = await requireAdmin();
    if (!admin) redirect("/");

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
