"use client";

import { useState } from "react";
import { NoticeComposer } from "@/components/NoticeComposer";
import { ImportView } from "@/components/ImportView";
import { ScheduleView } from "@/components/ScheduleView";

const TABS = [
  { id: "progress", label: "진행 현황" },
  { id: "import", label: "데이터 가져오기" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("progress");

  return (
    <div>
      <div className="mb-6 grid max-w-md grid-cols-2 gap-2">
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full py-2.5 text-[14px] font-medium transition ${
                selected
                  ? "bg-sage text-white"
                  : "border border-neutral-300 bg-white text-neutral-500"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "progress" ? (
        <>
          <ScheduleView variant="admin" />
          <NoticeComposer />
        </>
      ) : (
        <ImportView onApplied={() => setTab("progress")} />
      )}
    </div>
  );
}
