"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  label: string;
}

export default function BackButton({ label }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-sm mb-6 inline-block cursor-pointer"
      style={{
        color: "#7A8BA8",
        background: "none",
        border: "none",
        padding: 0,
      }}
    >
      &larr; {label}
    </button>
  );
}
