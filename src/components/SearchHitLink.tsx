"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function SearchHitLink({
  href,
  query,
  slug,
  title,
  className,
  children,
}: {
  href: string;
  query?: string;
  slug: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        void fetch("/api/search/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: query ?? "", slug, title }),
          keepalive: true,
        });
      }}
    >
      {children}
    </Link>
  );
}
