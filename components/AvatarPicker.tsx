"use client";

// AvatarPicker — shown inside the Navbar profile slide panel.
// Handles all avatar states:
//   null            → no preference (Google photo if available, else DiceBear)
//   "__initials__"  → user explicitly chose DiceBear over their Google photo
//   data URL        → user's uploaded custom photo

import { useRef, useState } from "react";
import { setUserAvatar } from "@/lib/firestore";

const INITIALS_SENTINEL = "__initials__";

function resizeImage(file: File, maxSide = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}

interface AvatarPickerProps {
  userId: string;
  currentAvatar: string | null;  // null | "__initials__" | data URL
  diceBearUrl: string;
  googlePhotoUrl: string | null; // user's Google profile photo if they signed in with Google
  onAvatarChange: (url: string | null) => void;
  onClose: () => void;
}

export default function AvatarPicker({
  userId,
  currentAvatar,
  diceBearUrl,
  googlePhotoUrl,
  onAvatarChange,
  onClose,
}: AvatarPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Derive what's currently active
  const usingCustomPhoto = Boolean(currentAvatar) && currentAvatar !== INITIALS_SENTINEL;
  const usingInitials    = currentAvatar === INITIALS_SENTINEL;
  // "using Google naturally" = no explicit preference set, but a Google photo exists
  const usingGoogle      = !currentAvatar && Boolean(googlePhotoUrl);

  // The image to show in the preview
  const previewSrc = usingCustomPhoto
    ? currentAvatar!
    : usingInitials
    ? diceBearUrl
    : googlePhotoUrl ?? diceBearUrl;

  const previewLabel = usingCustomPhoto
    ? "Custom photo"
    : usingInitials
    ? "Initials avatar"
    : googlePhotoUrl
    ? "Google photo (default)"
    : "Initials avatar (default)";

  const save = async (value: string | null) => {
    setSaving(true);
    await setUserAvatar(userId, value ?? "");
    onAvatarChange(value);
    setSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    setUploadError("");
    setSaving(true);
    try {
      const dataUrl = await resizeImage(file, 200);
      await setUserAvatar(userId, dataUrl);
      onAvatarChange(dataUrl);
    } catch {
      setUploadError("Failed to process image. Try a different file.");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid #1A2035" }}
      >
        <button
          onClick={onClose}
          className="text-sm transition hover:opacity-70"
          style={{ color: "#7A8BA8" }}
        >
          ← Back
        </button>
        <span
          className="text-sm font-semibold"
          style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
        >
          Change Avatar
        </span>
      </div>

      <div className="flex flex-col gap-5 px-5 py-6 overflow-y-auto flex-1">

        {/* Current avatar preview */}
        <div className="flex flex-col items-center gap-2">
          <img
            src={previewSrc}
            alt="Current avatar"
            className="rounded-full object-cover"
            style={{ width: 80, height: 80, border: "2px solid #1A2035" }}
          />
          <p className="text-xs" style={{ color: "#7A8BA8" }}>
            {previewLabel}
          </p>
        </div>

        <div style={{ height: 1, background: "#1A2035" }} />

        {/* Option: Use initials — shown when on Google photo or custom photo */}
        {(usingGoogle || usingCustomPhoto) && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7A8BA8" }}>
              Initials avatar
            </p>
            <button
              onClick={() => save(INITIALS_SENTINEL)}
              disabled={saving}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "#080B14", border: "1px solid #1A2035", color: "#F0F2FF" }}
            >
              <img src={diceBearUrl} alt="Initials" className="rounded-full shrink-0" style={{ width: 32, height: 32 }} />
              <span>Use initials avatar</span>
            </button>
            <p className="text-xs" style={{ color: "#7A8BA8" }}>
              Auto-generated from your name — no image needed.
            </p>
          </div>
        )}

        {/* Option: Use Google photo — shown when user explicitly switched away from it */}
        {googlePhotoUrl && (usingInitials || usingCustomPhoto) && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7A8BA8" }}>
              Google photo
            </p>
            <button
              onClick={() => save(null)}
              disabled={saving}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "#080B14", border: "1px solid #1A2035", color: "#F0F2FF" }}
            >
              <img src={googlePhotoUrl} alt="Google" referrerPolicy="no-referrer" className="rounded-full shrink-0 object-cover" style={{ width: 32, height: 32 }} />
              <span>Use Google photo</span>
            </button>
          </div>
        )}

        <div style={{ height: 1, background: "#1A2035" }} />

        {/* Custom upload */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7A8BA8" }}>
            Upload your own photo
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "#080B14", border: "1px solid #1A2035", color: "#F0F2FF" }}
          >
            📁 Choose from device
          </button>
          {uploadError && (
            <p className="text-xs" style={{ color: "#CC1F1F" }}>{uploadError}</p>
          )}
          <p className="text-xs" style={{ color: "#7A8BA8" }}>
            Any image — auto-resized to 200×200px. JPG, PNG, WebP all work.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
          />
        </div>

        {saving && (
          <p className="text-xs animate-pulse text-center" style={{ color: "#7A8BA8" }}>
            Saving…
          </p>
        )}

      </div>
    </div>
  );
}
