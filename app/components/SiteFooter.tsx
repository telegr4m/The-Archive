"use client";

import { usePathname } from "next/navigation";
import BackToTopButton from "./BackToTopButton";
import Footer from "./Footer";

export default function SiteFooter() {
  const pathname = usePathname();

  if (pathname === "/telegram") return null;

  return (
    <>
      <Footer />
      <BackToTopButton />
    </>
  );
}
