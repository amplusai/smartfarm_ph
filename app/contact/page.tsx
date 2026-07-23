"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "오류가 발생했습니다.");
      }

      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  }

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-green-900 to-green-700 px-8 py-24 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-300">
          Contact
        </p>
        <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">문의하기</h1>
        <p className="mt-6 text-green-100">
          IOTplus 스마트팜에 관심 있으신가요? 언제든지 연락해 주세요.
        </p>
      </section>

      {/* Form */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-xl">
          {status === "success" ? (
            <div className="rounded-2xl bg-green-50 p-10 text-center">
              <p className="text-4xl">✅</p>
              <h2 className="mt-4 text-xl font-bold text-green-800">문의가 접수되었습니다</h2>
              <p className="mt-2 text-gray-600">빠른 시일 내에 답변드리겠습니다.</p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-6 rounded-xl bg-green-700 px-6 py-2 text-sm font-semibold text-white hover:bg-green-800"
              >
                새 문의 작성
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="홍길동"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="example@email.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  문의 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="문의 내용을 입력해 주세요."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-500">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
              >
                {status === "loading" ? "전송 중..." : "문의 보내기"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
