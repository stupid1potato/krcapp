"use client";

import { FormEvent, Suspense, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/TopBar";

function postLoginPath(callbackUrl: string | null) {
  const raw = callbackUrl?.trim() || "/";
  let parsed: URL;
  try {
    parsed = raw.startsWith("http://") || raw.startsWith("https://")
      ? new URL(raw)
      : new URL(raw, "http://localhost");
  } catch {
    return "/";
  }
  const path = parsed.pathname || "/";
  const search = parsed.search;
  if (path.startsWith("/login") || path.startsWith("/api")) return "/";
  if (path.startsWith("/notices") || path.startsWith("/profile") || path.startsWith("/admin")) {
    return `${path}${search}`;
  }
  if (path === "/" || path.startsWith("/bracket")) return `${path}${search}`;
  return "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFailed(false);
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setBusy(false);
    if (!result || result.error || result.ok === false) {
      setFailed(true);
      setPassword("");
      requestAnimationFrame(() => passwordRef.current?.focus());
      return;
    }
    router.replace(postLoginPath(searchParams.get("callbackUrl")));
    router.refresh();
  }

  const fieldClass = failed
    ? "w-full rounded-lg border-2 border-red-500 bg-white px-3 py-3 text-[15px] outline-none"
    : "w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 text-[15px] outline-none focus:border-sage";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3">
      {failed ? (
        <div className="rounded-md bg-red-50 px-3 py-3 text-[13px] leading-5 text-red-600">
          Sign in failed. Check the details you provided are correct.
        </div>
      ) : null}

      <input
        name="username"
        autoComplete="username"
        placeholder="Team number"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={fieldClass}
      />
      <input
        ref={passwordRef}
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={fieldClass}
      />
      <button
        type="submit"
        disabled={busy}
        className="mt-2 w-full rounded-lg bg-[#2563eb] py-3.5 text-[16px] font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Signing in..." : "Sign in with KRC APP"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-white px-6">
      <TopBar />
      <div className="pt-8">
        <h1 className="text-[24px] font-bold text-black">로그인</h1>
        <p className="mt-2 text-[14px] text-neutral-500">팀 번호와 비밀번호로 로그인하세요.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
