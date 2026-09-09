"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LiveClock } from "@/components/LiveClock";
import { ProfileButton } from "@/components/ProfileButton";

export function TopBar() {
  const pathname = usePathname();
  const showProfile = pathname !== "/login";

  return (
    <header className="relative px-4 pb-1 pt-3 text-center">
      <Link
        href="/"
        className="inline-block max-w-[calc(100%-5.5rem)] truncate font-serif text-[26px] font-medium leading-none tracking-tight text-black min-[390px]:text-[28px]"
      >
        KRC APP
      </Link>
      <LiveClock className="mt-1 block font-mono text-[13px] tracking-wide text-neutral-400" />
      {showProfile ? <ProfileButton /> : null}
    </header>
  );
}
