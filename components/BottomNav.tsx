"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, TrophyIcon } from "@/components/icons";

const ITEMS = [
  { href: "/notices", label: "공지", Icon: BellIcon, isActive: (path: string) => path.startsWith("/notices") },
  {
    href: "/",
    label: "대진표",
    Icon: TrophyIcon,
    isActive: (path: string) => path === "/" || path.startsWith("/bracket"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
      <div className="pointer-events-auto mx-auto grid w-full max-w-[430px] grid-cols-2 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ href, label, Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 py-2 text-[11px] leading-none ${
                active ? "text-black" : "text-neutral-400"
              }`}
            >
              <Icon className="h-6 w-6 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
