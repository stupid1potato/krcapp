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
            className={`rounded-full px-2 py-2.5 text-[13px] font-medium leading-none whitespace-nowrap transition min-[390px]:text-[14px] ${
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
