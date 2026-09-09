"use client";

import { useEffect } from "react";
import { dismissNoticeId } from "@/lib/notice-popup";

export function NoticeDismiss({ id }: { id: string }) {
  useEffect(() => {
    dismissNoticeId(id);
  }, [id]);
  return null;
}
