"use client";

import { FormEvent, useState } from "react";

export function NoticeComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = (await res.json()) as { error?: string; title?: string };
      if (!res.ok) throw new Error(data.error || "공지 등록에 실패했습니다.");
      setTitle("");
      setBody("");
      setMessage(`공지를 등록했습니다: ${data.title}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "공지 등록에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 max-w-xl rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="text-[18px] font-medium text-black">공지 작성</h2>
      <p className="mt-1 text-[13px] text-neutral-500">참가자 앱에는 작성 버튼이 없습니다. 여기와 시드로만 등록합니다.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-[15px] outline-none focus:border-sage"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="본문"
          rows={5}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-[15px] outline-none focus:border-sage"
        />
        <button
          type="submit"
          disabled={busy || !title.trim() || !body.trim()}
          className="rounded-xl bg-sage px-5 py-2.5 text-[15px] font-medium text-white disabled:opacity-50"
        >
          {busy ? "등록 중..." : "공지 등록"}
        </button>
      </form>
      {message ? <p className="mt-3 text-[13px] text-neutral-500">{message}</p> : null}
    </section>
  );
}
