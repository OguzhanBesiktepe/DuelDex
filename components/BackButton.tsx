"use client";

// BackButton — renders either a Next.js Link (when an explicit href is given) or a
// router.back() button. Using an href is preferred when we know the exact destination;
// router.back() is used when the origin can vary (e.g. search results vs. a category page).

import { useRouter } from "next/navigation";
import Link from "next/link";

interface BackButtonProps {
  label: string;
  href?: string;
}

export default function BackButton({ label, href }: BackButtonProps) {
  const router = useRouter();

  const style = {
    color: "#7A8BA8",
    background: "none",
    border: "none",
    padding: 0,
  };

  if (href) {
    return (
      <Link
        href={href}
        className="text-sm mb-6 inline-block cursor-pointer"
        style={style}
      >
        &larr; {label}
      </Link>
    );
  }

  return (
    <button
      onClick={() => router.back()}
      className="text-sm mb-6 inline-block cursor-pointer"
      style={style}
    >
      &larr; {label}
    </button>
  );
}
