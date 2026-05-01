"use client";

// Sign-in page — three-view form (signin / signup / forgot password) rendered as a
// single component with shared state. Google OAuth and email/password are both supported.
// The page hides the Navbar and Footer (see ClientLayout) for a distraction-free experience.
// Background: two columns of YGO cards scroll on the left, two Pokémon columns on the right.

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type View = "signin" | "signup" | "forgot";

// ─── Card rain data ────────────────────────────────────────────────────────────

const YGO_CARDS = [
  "https://images.ygoprodeck.com/images/cards/46986414.jpg",
  "https://images.ygoprodeck.com/images/cards/89631139.jpg",
  "https://images.ygoprodeck.com/images/cards/74677422.jpg",
  "https://images.ygoprodeck.com/images/cards/44095762.jpg",
  "https://images.ygoprodeck.com/images/cards/83764718.jpg",
  "https://images.ygoprodeck.com/images/cards/55144522.jpg",
  "https://images.ygoprodeck.com/images/cards/41420027.jpg",
  "https://images.ygoprodeck.com/images/cards/62279055.jpg",
  "https://images.ygoprodeck.com/images/cards/38033121.jpg",
  "https://images.ygoprodeck.com/images/cards/5405694.jpg",
  "https://images.ygoprodeck.com/images/cards/40640057.jpg",
  "https://images.ygoprodeck.com/images/cards/15341821.jpg",
];

const PKMN_CARDS = [
  "https://assets.tcgdex.net/en/base/base1/4/high.webp",
  "https://assets.tcgdex.net/en/base/base1/10/high.webp",
  "https://assets.tcgdex.net/en/base/base1/58/high.webp",
  "https://assets.tcgdex.net/en/base/base1/2/high.webp",
  "https://assets.tcgdex.net/en/base/base1/15/high.webp",
  "https://assets.tcgdex.net/en/base/base1/14/high.webp",
  "https://assets.tcgdex.net/en/base/base1/6/high.webp",
  "https://assets.tcgdex.net/en/base/base1/7/high.webp",
  "https://assets.tcgdex.net/en/base/base1/9/high.webp",
  "https://assets.tcgdex.net/en/base/base1/11/high.webp",
  "https://assets.tcgdex.net/en/base/base1/16/high.webp",
  "https://assets.tcgdex.net/en/base/base1/5/high.webp",
];

// Duplicates images so the scroll loop is seamless (translateY -50% = exactly one set height).
function CardColumn({
  images,
  duration,
  startAt,
  width = 88,
  opacity = 0.13,
}: {
  images: string[];
  duration: number;
  startAt: number;
  width?: number;
  opacity?: number;
}) {
  const loop = [...images, ...images];
  return (
    <div style={{ width, flexShrink: 0 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          animationName: "cardRainScroll",
          animationDuration: `${duration}s`,
          animationDelay: `${startAt}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          willChange: "transform",
        }}
      >
        {loop.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            decoding="async"
            style={{ width, height: "auto", borderRadius: 5, opacity, display: "block" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Google icon ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const router = useRouter();
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
  } = useAuth();

  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccessMsg("");
  };

  const switchView = (v: View) => {
    clearForm();
    setView(v);
  };

  const friendlyError = (code: string) => {
    switch (code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user") setError(friendlyError(code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (view === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (view === "signin") {
        await signInWithEmail(email, password);
        router.replace("/");
      } else if (view === "signup") {
        await signUpWithEmail(email, password);
        router.replace("/");
      } else {
        await sendPasswordReset(email);
        setSuccessMsg("Password reset email sent! Check your inbox.");
      }
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? "";
      if (view === "signin" && code === "auth/invalid-credential") {
        setError(
          'Invalid email or password. If you signed up with Google, use the "Continue with Google" button above.',
        );
        setSubmitting(false);
        return;
      }
      setError(friendlyError(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Keyframe for scrolling columns */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cardRainScroll {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
      ` }} />

      {/* ── Card rain (desktop only) ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Left side — YGO cards */}
        <div className="absolute top-0 left-0 hidden md:flex" style={{ gap: 10 }}>
          <CardColumn images={YGO_CARDS} duration={30} startAt={0} />
          <CardColumn images={[...YGO_CARDS].reverse()} duration={23} startAt={-10} />
        </div>

        {/* Right side — Pokémon cards */}
        <div className="absolute top-0 right-0 hidden md:flex" style={{ gap: 10 }}>
          <CardColumn images={[...PKMN_CARDS].reverse()} duration={26} startAt={-6} />
          <CardColumn images={PKMN_CARDS} duration={34} startAt={-16} />
        </div>

        {/* Gradient fades: background bleeds over the columns toward the center */}
        <div
          className="absolute inset-y-0 left-0 hidden md:block"
          style={{ width: 260, background: "linear-gradient(to right, var(--background) 40%, transparent)" }}
        />
        <div
          className="absolute inset-y-0 right-0 hidden md:block"
          style={{ width: 260, background: "linear-gradient(to left, var(--background) 40%, transparent)" }}
        />
      </div>

      {/* ── Form content ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link
          href="/"
          className="mb-8 block transition-transform hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(255,122,0,0.6)]"
        >
          <Image
            src="/Logo.png"
            alt="DuelDex"
            width={200}
            height={65}
            className="object-contain drop-shadow-[0_0_20px_rgba(255,122,0,0.4)]"
            priority
            unoptimized
          />
        </Link>

        {/* Card */}
        <div
          className="w-full max-w-md rounded-2xl border p-8 shadow-2xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Heading */}
          <h1
            className="mb-1 text-center text-2xl font-bold"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-cinzel)" }}
          >
            {view === "signin" && "Welcome Back"}
            {view === "signup" && "Create Account"}
            {view === "forgot" && "Reset Password"}
          </h1>
          <p className="mb-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            {view === "signin" && "Search, Track & Collect."}
            {view === "signup" && "Join DuelDex and start tracking cards."}
            {view === "forgot" && "Enter your email and we'll send a reset link."}
          </p>

          {/* Google button — only on signin/signup */}
          {view !== "forgot" && (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition disabled:opacity-50"
                style={{
                  borderColor: "var(--pkmn-accent)",
                  color: "var(--text-primary)",
                  background: "rgba(0,170,255,0.05)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,170,255,0.12)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(0,170,255,0.05)")
                }
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3">
                <hr className="flex-1" style={{ borderColor: "var(--border)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  or
                </span>
                <hr className="flex-1" style={{ borderColor: "var(--border)" }} />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                className="mb-1 block text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-[#00AAFF]"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Password — not shown on forgot */}
            {view !== "forgot" && (
              <div>
                <label
                  className="mb-1 block text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-[#00AAFF]"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            )}

            {/* Confirm password — only on signup */}
            {view === "signup" && (
              <div>
                <label
                  className="mb-1 block text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-[#00AAFF]"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            )}

            {/* Forgot password link */}
            {view === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchView("forgot")}
                  className="text-xs transition hover:underline"
                  style={{ color: "var(--pkmn-accent)" }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error / success */}
            {error && (
              <p
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "rgba(204,31,31,0.15)",
                  color: "#ff6b6b",
                  border: "1px solid rgba(204,31,31,0.3)",
                }}
              >
                {error}
              </p>
            )}
            {successMsg && (
              <p
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "rgba(62,207,106,0.15)",
                  color: "var(--price-color)",
                  border: "1px solid rgba(62,207,106,0.3)",
                }}
              >
                {successMsg}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(90deg, #FF7A00, #00AAFF)",
                color: "var(--background)",
              }}
            >
              {submitting
                ? "Please wait…"
                : view === "signin"
                  ? "Sign In"
                  : view === "signup"
                    ? "Create Account"
                    : "Send Reset Email"}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            {view === "signin" && (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => switchView("signup")}
                  className="font-semibold transition hover:underline"
                  style={{ color: "var(--pkmn-accent)" }}
                >
                  Sign Up
                </button>
              </>
            )}
            {view === "signup" && (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchView("signin")}
                  className="font-semibold transition hover:underline"
                  style={{ color: "var(--pkmn-accent)" }}
                >
                  Sign In
                </button>
              </>
            )}
            {view === "forgot" && (
              <button
                onClick={() => switchView("signin")}
                className="font-semibold transition hover:underline"
                style={{ color: "var(--pkmn-accent)" }}
              >
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
