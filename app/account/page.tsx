"use client";

// Account Settings page — lets signed-in users change their password.
// Email/password accounts: re-authenticates first, then updates the password.
// Google (OAuth) accounts: shows an informational message instead.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

type Status = { type: "success" | "error"; message: string } | null;

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/signin");
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#080B14" }}>
        <p className="animate-pulse text-sm" style={{ color: "#7A8BA8" }}>Loading…</p>
      </div>
    );
  }
  if (!user) return null;

  // Detect whether this account uses email/password or a social provider (Google)
  const isEmailUser = user.providerData.some((p) => p.providerId === "password");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ type: "error", message: "New password must be at least 6 characters." });
      return;
    }

    setSubmitting(true);
    try {
      // Firebase requires fresh credentials before sensitive operations
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, newPassword);

      setStatus({ type: "success", message: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setStatus({ type: "error", message: "Current password is incorrect." });
      } else if (code === "auth/weak-password") {
        setStatus({ type: "error", message: "New password is too weak. Use at least 6 characters." });
      } else if (code === "auth/too-many-requests") {
        setStatus({ type: "error", message: "Too many attempts. Please try again later." });
      } else {
        setStatus({ type: "error", message: "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1
          className="text-3xl font-bold mb-8"
          style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
        >
          Account Settings
        </h1>

        {/* User info */}
        <div
          className="rounded-xl border p-4 mb-6 flex items-center gap-3"
          style={{ background: "#0E1220", borderColor: "#1A2035" }}
        >
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="Avatar"
              referrerPolicy="no-referrer"
              className="rounded-full object-cover shrink-0"
              style={{ width: 44, height: 44 }}
            />
          )}
          <div className="min-w-0">
            {user.displayName && (
              <p className="text-sm font-semibold truncate" style={{ color: "#F0F2FF" }}>
                {user.displayName}
              </p>
            )}
            <p className="text-xs truncate" style={{ color: "#7A8BA8" }}>{user.email}</p>
          </div>
        </div>

        {/* Change password */}
        <div
          className="rounded-xl border p-6"
          style={{ background: "#0E1220", borderColor: "#1A2035" }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: "#F0F2FF" }}>
            Change Password
          </h2>

          {isEmailUser ? (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#7A8BA8" }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition focus:ring-1"
                  style={{
                    background: "#080B14",
                    border: "1px solid #1A2035",
                    color: "#F0F2FF",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#FF7A00")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1A2035")}
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#7A8BA8" }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
                  style={{
                    background: "#080B14",
                    border: "1px solid #1A2035",
                    color: "#F0F2FF",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#FF7A00")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1A2035")}
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#7A8BA8" }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
                  style={{
                    background: "#080B14",
                    border: "1px solid #1A2035",
                    color: "#F0F2FF",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#FF7A00")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1A2035")}
                />
              </div>

              {status && (
                <p
                  className="text-xs rounded-lg px-3 py-2.5"
                  style={{
                    background: status.type === "success" ? "rgba(62,207,106,0.1)" : "rgba(204,31,31,0.1)",
                    color: status.type === "success" ? "#3ecf6a" : "#CC1F1F",
                    border: `1px solid ${status.type === "success" ? "rgba(62,207,106,0.3)" : "rgba(204,31,31,0.3)"}`,
                  }}
                >
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg py-2.5 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#FF7A00", color: "#080B14" }}
              >
                {submitting ? "Updating…" : "Update Password"}
              </button>
            </form>
          ) : (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(0,170,255,0.08)",
                border: "1px solid rgba(0,170,255,0.25)",
                color: "#7A8BA8",
              }}
            >
              Your account uses{" "}
              <span style={{ color: "#00AAFF" }}>Google Sign-In</span>. Password
              management is handled by Google — visit{" "}
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition hover:opacity-80"
                style={{ color: "#00AAFF" }}
              >
                myaccount.google.com
              </a>{" "}
              to update your password.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
