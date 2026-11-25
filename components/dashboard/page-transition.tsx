"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

// Sidebar links tag navigations nav-forward or nav-back; these map each type to its slide class.
const directional = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
} as const;

/**
 * Slides the page content in the content pad. The name is per route, so the old page and the
 * new page are separate transition groups: they slide out and in instead of morphing into each
 * other. The groups are clipped to the content box (see the page-content rules in globals.css),
 * so the slide stays inside the pad and the header and sidebar never move.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const name = `page-${pathname.replace(/[^a-zA-Z0-9]/g, "-")}`;

  return (
    <ViewTransition name={name} enter={directional} exit={directional} default="none">
      {children}
    </ViewTransition>
  );
}
