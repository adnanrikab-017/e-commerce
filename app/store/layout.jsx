import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "GoCart. - Store Management",
  description: "GoCart. - Store Management",
};

export default async function StoreLayout({ children }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/store");
  }

  return <>{children}</>;
}
