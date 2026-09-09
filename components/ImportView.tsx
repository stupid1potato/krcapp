"use client";

import { useEffect, useMemo, useState } from "react";
import type { FilePreview, ImportPreview } from "@/lib/import-types";

type Props = {
  onApplied: () => void;
};

function fileLabel(file: File | null, fallback: string) {
  return file ? file.name : fallback;
}

function PreviewTable({ preview }: { preview: FilePreview }) {
  const columns = useMemo(() => {
    const keys = new Set<string>();
    for (const row of preview.rows) {
      Object.keys(row.values).forEach((key) => keys.add(key));
    }
    return [...keys];
  }, [preview.rows]);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
        <h3 className="min-w-0 truncate text-[16px] font-semibold text-black">
          {preview.kind === "teams" ? "teams.csv" : "matches.csv"}
        </h3>
        <p className="text-[13px] text-neutral-500">
          {preview.fileName} · {preview.rows.length}행
          {preview.errorCount > 0 ? ` · 오류 ${preview.errorCount}` : ""}
        </p>
      </div>

      {preview.fileErrors.length > 0 ? (
        <ul className="space-y-1 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {preview.fileErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {preview.rows.length === 0 ? (
        <p className="px-4 py-6 text-[13px] text-neutral-400">데이터 행이 없습니다.</p>
      ) : (
        <div className="max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table
            className={`w-max min-w-full text-left text-[13px] ${
              preview.kind === "matches" ? "min-w-[52rem]" : "min-w-[28rem]"
            }`}
          >
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">행</th>
                {columns.map((column) => (
                  <th key={column} className="whitespace-nowrap px-3 py-2 font-medium">
                    {column}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">오류</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => {
                const bad = row.errors.length > 0;
                return (
                  <tr key={row.line} className={bad ? "bg-red-50 text-red-800" : "text-neutral-800"}>
                    <td className="px-3 py-2 align-top font-mono text-[12px]">{row.line}</td>
                    {columns.map((column) => (
                      <td key={column} className="whitespace-nowrap px-3 py-2 align-top">
                        {row.values[column] || <span className="text-neutral-300">—</span>}
                      </td>
                    ))}
                    <td className="min-w-[9rem] max-w-[16rem] px-3 py-2 align-top whitespace-normal">
                      {bad ? row.errors.join(" · ") : <span className="text-neutral-300">OK</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ImportView({ onApplied }: Props) {
  const [teamsFile, setTeamsFile] = useState<File | null>(null);
  const [matchesFile, setMatchesFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasFiles = Boolean(teamsFile || matchesFile);

  function formData() {
    const form = new FormData();
    if (teamsFile) form.append("teams", teamsFile);
    if (matchesFile) form.append("matches", matchesFile);
    return form;
  }

  async function runPreview() {
    if (!hasFiles) {
      setPreview(null);
      return;
    }
    setBusy("preview");
    setError(null);
    try {
      const res = await fetch("/api/admin/import/preview", { method: "POST", body: formData() });
      const data = (await res.json()) as ImportPreview & { error?: string };
      if (!res.ok) throw new Error(data.error || "미리보기에 실패했습니다.");
      setPreview(data);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "미리보기에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (!hasFiles) {
      setPreview(null);
      setError(null);
      return;
    }
    void runPreview();
    // Files are the preview source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamsFile, matchesFile]);

  async function apply() {
    setBusy("apply");
    setError(null);
    try {
      const res = await fetch("/api/admin/import/apply", { method: "POST", body: formData() });
      const data = (await res.json()) as {
        error?: string;
        preview?: ImportPreview;
        eventName?: string;
      };
      if (!res.ok) {
        if (data.preview) setPreview(data.preview);
        throw new Error(data.error || "적용에 실패했습니다.");
      }
      setConfirmOpen(false);
      onApplied();
    } catch (err) {
      setConfirmOpen(false);
      setError(err instanceof Error ? err.message : "적용에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  const canApply = Boolean(preview?.canApply && hasFiles && busy === null);

  return (
    <div className="pb-16">
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-black md:text-[28px]">데이터 가져오기</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-5 text-neutral-500">
          UTF-8 CSV로 현재 대회의 팀과 경기를 교체합니다. 업로드 → 미리보기 → 확인 후 반영. 부분 병합은
          없고, 적용 시 체크인은 초기화됩니다. 운영 계정은 CSV로 만들지 않습니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-[13px] min-[390px]:gap-3">
        <a
          href="/templates/teams.csv"
          download="teams.csv"
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-neutral-700"
        >
          teams.csv 양식 (UTF-8)
        </a>
        <a
          href="/templates/matches.csv"
          download="matches.csv"
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-neutral-700"
        >
          matches.csv 양식 (UTF-8)
        </a>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="min-w-0 overflow-hidden rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-4">
          <span className="block text-[14px] font-medium text-black">teams.csv</span>
          <span className="mt-1 block text-[12px] leading-5 text-neutral-400">
            UTF-8 · 필수 team_number, team_name · password 열 없음
          </span>
          <input
            key={`teams-${inputKey}`}
            type="file"
            accept=".csv,text/csv"
            className="mt-3 block w-full min-w-0 max-w-full text-[13px] file:mr-3 file:max-w-full"
            onChange={(event) => setTeamsFile(event.target.files?.[0] ?? null)}
          />
          <span className="mt-2 block truncate text-[12px] text-neutral-500">{fileLabel(teamsFile, "선택 안 함")}</span>
        </label>
        <label className="min-w-0 overflow-hidden rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-4">
          <span className="block text-[14px] font-medium text-black">matches.csv</span>
          <span className="mt-1 block text-[12px] leading-5 text-neutral-400">
            UTF-8 · 필수 match_number, red1, red2, blue1, blue2, 시간 열
          </span>
          <input
            key={`matches-${inputKey}`}
            type="file"
            accept=".csv,text/csv"
            className="mt-3 block w-full min-w-0 max-w-full text-[13px] file:mr-3 file:max-w-full"
            onChange={(event) => setMatchesFile(event.target.files?.[0] ?? null)}
          />
          <span className="mt-2 block truncate text-[12px] text-neutral-500">{fileLabel(matchesFile, "선택 안 함")}</span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void runPreview()}
          disabled={!hasFiles || busy !== null}
          className="rounded-xl bg-sage px-3.5 py-2.5 text-[14px] font-medium text-white disabled:opacity-50 min-[430px]:px-5 min-[430px]:text-[15px]"
        >
          {busy === "preview" ? "확인 중..." : "미리보기"}
        </button>
        <button
          type="button"
          onClick={() => {
            setTeamsFile(null);
            setMatchesFile(null);
            setPreview(null);
            setError(null);
            setInputKey((value) => value + 1);
          }}
          className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-[14px] text-neutral-600 min-[430px]:px-5 min-[430px]:text-[15px]"
        >
          파일 지우기
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!canApply}
          className={`rounded-xl px-3.5 py-2.5 text-[14px] font-medium min-[430px]:px-5 min-[430px]:text-[15px] ${
            canApply
              ? "bg-red-600 text-white"
              : "cursor-not-allowed bg-neutral-200 text-neutral-400"
          }`}
        >
          이번 대회 교체
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {preview ? (
        <p className="mt-5 text-[13px] text-neutral-500">
          오류 {preview.errorCount}건
          {preview.canApply
            ? " · 적용할 수 있습니다."
            : preview.message
              ? ` · ${preview.message}`
              : " · 적용할 수 없습니다."}
        </p>
      ) : null}

      {preview?.teams ? <PreviewTable preview={preview.teams} /> : null}
      {preview?.matches ? <PreviewTable preview={preview.matches} /> : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6 min-[390px]:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-[18px] font-medium text-black">이번 대회 교체</h2>
            <p className="mt-2 text-[14px] leading-6 text-neutral-600">
              현재 대회의 팀/경기 데이터를 업로드한 CSV로 바꿉니다. 경기는 전체 교체이며 기존 체크인은
              초기화됩니다. 운영 계정은 유지됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 min-[390px]:flex-row min-[390px]:justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy === "apply"}
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-[14px] text-neutral-600"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void apply()}
                disabled={busy === "apply"}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-60"
              >
                {busy === "apply" ? "교체 중..." : "이번 대회 교체"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
