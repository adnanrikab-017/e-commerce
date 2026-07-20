import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: { default: "GoCart | Shop smarter", template: "%s | GoCart" },
    description: "Shop GoCart's trusted collection with fast delivery and simple checkout.",
    robots: { index: true, follow: true },
    openGraph: { type: "website", siteName: "GoCart" },
    twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${outfit.className} bg-white text-slate-900 antialiased`}>
                <StoreProvider>
                    <Toaster />
                    {children}
                </StoreProvider>
            </body>
        </html>
    );
}
