"use client";

export function ScheduleTabs({
  value,
  onChange,
}: {
  value: "mine" | "all";
  onChange: (value: "mine" | "all") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 px-3 min-[390px]:px-4">
      {(
        [
          { id: "mine", label: "우리팀 대진표" },
          { id: "all", label: "전체 대진표" },
        ] as const
      ).map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`min-w-0 rounded-full px-1.5 py-2.5 text-[12px] font-medium leading-none transition min-[360px]:px-2 min-[360px]:text-[13px] min-[390px]:text-[14px] ${
              selected
                ? "bg-sage text-white"
                : "border border-neutral-300 bg-white text-neutral-500"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
