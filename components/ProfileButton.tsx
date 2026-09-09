"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ProfileIcon } from "@/components/icons";

export function ProfileButton() {
  const { data, status } = useSession();
  const href =
    status === "authenticated" && data?.user
      ? "/profile"
      : "/login?callbackUrl=%2F";

  return (
    <Link
      href={href}
      aria-label={status === "authenticated" ? "프로필" : "로그인"}
      className="absolute right-4 top-1 flex h-9 w-9 items-center justify-center rounded-full text-neutral-800"
    >
      <ProfileIcon className="h-8 w-8" />
    </Link>
  );
}
