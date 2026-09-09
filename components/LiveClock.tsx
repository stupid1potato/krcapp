"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/format";

export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time
      dateTime={now ? now.toISOString() : undefined}
      className={className}
      suppressHydrationWarning
    >
      {now ? formatClock(now) : "--:--:--"}
    </time>
  );
}
