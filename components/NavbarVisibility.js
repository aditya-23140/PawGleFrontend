"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";

export default function NavbarVisibility() {
  const pathname = usePathname();

  return pathname !== "/" ? <Navbar/> : null;
}
