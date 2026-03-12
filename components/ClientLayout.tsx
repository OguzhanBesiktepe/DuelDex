"use client";

// ClientLayout — wraps every page with Navbar and Footer.
// Auth pages (e.g. /signin) hide both so the full screen is available for the sign-in form.

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Routes where Navbar and Footer should be hidden
const AUTH_ROUTES = ["/signin"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isAuthPage && <Footer />}
    </>
  );
}
