"use client";

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
