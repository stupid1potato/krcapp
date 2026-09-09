"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MatchCard } from "@/components/MatchCard";
import { ScheduleTabs } from "@/components/ScheduleTabs";
import { TeamModal } from "@/components/TeamModal";
import { isStaffRole } from "@/lib/roles";
import type { EventScheduleDTO, TeamRef } from "@/lib/types";

function ScheduleViewInner({ variant = "app" }: { variant?: "app" | "admin" }) {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const myTeamNumber = session?.user?.teamNumber ?? null;
  const canManage = isStaffRole(session?.user?.role);
  const highlightNumber = Number(searchParams.get("match"));
  const hasHighlight = Number.isFinite(highlightNumber) && highlightNumber > 0;

  const [userTab, setUserTab] = useState<"mine" | "all" | null>(null);
  const [schedule, setSchedule] = useState<EventScheduleDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TeamRef | null>(null);

  const tabReady = variant === "admin" || status !== "loading";
  const tab: "mine" | "all" =
    variant === "admin" ? "all" : (userTab ?? (myTeamNumber ? "mine" : "all"));

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      if (!res.ok) throw new Error("대진표를 불러오지 못했습니다.");
      const data = (await res.json()) as EventScheduleDTO;
      setSchedule(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "대진표를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (variant === "admin" || !tabReady || !schedule || !hasHighlight) return;
    const match = schedule.matches.find((item) => item.number === highlightNumber);
    if (!match) return;
    const inMine = Boolean(
      myTeamNumber && match.slots.some((slot) => slot.team.number === myTeamNumber),
    );
    if (!inMine) setUserTab("all");
  }, [variant, tabReady, schedule, hasHighlight, highlightNumber, myTeamNumber]);

  const matches = useMemo(() => {
    if (!schedule) return [];
    if (tab === "all" || variant === "admin") return schedule.matches;
    if (!myTeamNumber) return [];
    return schedule.matches.filter((match) =>
      match.slots.some((slot) => slot.team.number === myTeamNumber),
    );
  }, [schedule, tab, myTeamNumber, variant]);

  useEffect(() => {
    if (!hasHighlight || matches.length === 0) return;
    const el = document.getElementById(`match-${highlightNumber}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hasHighlight, highlightNumber, matches, tab]);

  return (
    <div>
      {variant === "app" ? (
        <>
          <div className="px-4 pb-3 pt-4">
            <h1 className="text-[24px] font-medium leading-none text-black min-[390px]:text-[28px]">대진표</h1>
            <p className="mt-2 text-[14px] text-neutral-400">{schedule?.name ?? " "}</p>
          </div>
          {tabReady ? <ScheduleTabs value={tab} onChange={setUserTab} /> : null}
        </>
      ) : (
        <div className="mb-5">
          <h1 className="text-[22px] font-medium leading-tight text-black md:text-[28px]">경기 진행 현황</h1>
          <p className="mt-1 text-[13px] text-neutral-500 md:text-[14px]">
            {schedule?.name} · {schedule?.matchCount ?? 0}경기
          </p>
          <p className="mt-2 max-w-2xl text-[13px] leading-5 text-neutral-500">
            참가자 대진표와 같은 카드입니다. 10초마다 새로고침되며, 팀을 눌러 체크인하거나 알림을 보낼
            수 있습니다.
          </p>
        </div>
      )}

      {error ? <p className="px-4 py-6 text-sm text-red-500">{error}</p> : null}

      {variant === "app" && !tabReady ? (
        <p className="px-4 py-10 text-sm text-neutral-400">불러오는 중...</p>
      ) : (
        <>
          {variant === "app" && tab === "mine" && status !== "loading" && !session?.user ? (
            <div className="mx-4 mt-8 rounded-2xl border border-neutral-200 px-5 py-8 text-center">
              <p className="text-[15px] text-neutral-600">로그인하면 우리 팀 경기를 볼 수 있습니다.</p>
              <Link
                href="/login?callbackUrl=%2F"
                className="mt-4 inline-flex rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-white"
              >
                로그인
              </Link>
            </div>
          ) : null}

          {variant === "app" &&
          tab === "mine" &&
          session?.user &&
          matches.length === 0 &&
          schedule ? (
            <p className="px-4 py-10 text-center text-[15px] text-neutral-400">우리 팀 경기가 아직 없어요</p>
          ) : null}

          {variant === "app" && tab === "all" && schedule && matches.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-neutral-400">대진표가 준비 중이에요</p>
          ) : null}

          <div
            className={
              variant === "admin"
                ? "mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
                : "mt-4 flex min-w-0 flex-col gap-3 px-3 pb-4"
            }
          >
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                myTeamNumber={myTeamNumber}
                highlighted={hasHighlight && match.number === highlightNumber}
                onSelectTeam={setSelected}
              />
            ))}
          </div>
        </>
      )}

      {selected ? (
        <TeamModal
          key={`${selected.slotId}-${selected.checkedIn}`}
          team={selected}
          canManage={canManage}
          onClose={() => setSelected(null)}
          onChanged={() => {
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

export function ScheduleView({ variant = "app" }: { variant?: "app" | "admin" }) {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-sm text-neutral-400">불러오는 중...</p>}>
      <ScheduleViewInner variant={variant} />
    </Suspense>
  );
}
