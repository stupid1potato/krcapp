"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, TrophyIcon } from "@/components/icons";

const ITEMS = [
  { href: "/notices", label: "공지", Icon: BellIcon },
  { href: "/", label: "대진표", Icon: TrophyIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-[430px] grid-cols-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                active ? "text-black" : "text-neutral-400"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
