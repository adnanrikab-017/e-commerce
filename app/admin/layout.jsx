import AdminLayout from "@/components/admin/AdminLayout";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "GoCart. - Admin",
    description: "GoCart. - Admin",
};

export default async function RootAdminLayout({ children }) {
    const session = await getSession();
    if (!session) {
        redirect("/login?redirect=/admin");
    }
    if (session.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <AdminLayout>
            {children}
        </AdminLayout>
    );
}

