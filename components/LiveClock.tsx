"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/format";

export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time dateTime={now.toISOString()} className={className}>
      {formatClock(now)}
    </time>
  );
}
