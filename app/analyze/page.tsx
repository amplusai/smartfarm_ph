"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

type YoloResult = {
  stage: string;
  detections: { label: string; confidence: number }[];
  control: { temp_target: number; humidity_target: number; co2_limit: number; desc: string };
};

type AnalyzeResult = {
  analysis: string;
  sensor: { temp: number; humidity: number; co2: number; substrate_temp: number };
  yolo: YoloResult | null;
};

export default function AnalyzePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  }

  function handleReset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-green-900">버섯 이미지 분석</h1>
        <p className="mt-2 text-gray-500">
          버섯 사진을 업로드하면 YOLO 감지 + AI 분석으로 생육단계와 센서 제어 권장값을 제공합니다.
        </p>

        {/* 업로드 영역 */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-green-300 bg-white p-12 transition hover:border-green-500"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {preview ? (
            <img src={preview} alt="preview" className="max-h-64 rounded-xl object-contain" />
          ) : (
            <>
              <span className="text-5xl">🍄</span>
              <p className="mt-4 font-medium text-gray-600">클릭하거나 이미지를 드래그하세요</p>
              <p className="mt-1 text-sm text-gray-400">JPG, PNG, WEBP 지원</p>
            </>
          )}
        </div>

        {file && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "분석 중..." : "AI 분석 시작"}
          </button>
        )}

        {error && <p className="mt-4 text-red-500">{error}</p>}

        {/* 결과 */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* YOLO 결과 */}
            {result.yolo && (
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="font-bold text-gray-800">YOLO 감지 결과</h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-800">
                    생육단계: {result.yolo.stage}
                  </span>
                  <span className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-700">
                    감지: {result.yolo.detections.length}개
                  </span>
                </div>
                <div className="mt-4 rounded-xl bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-800">센서 제어 권장 ({result.yolo.stage})</p>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-gray-500">목표 온도</p>
                      <p className="font-bold text-green-700">{result.yolo.control.temp_target}°C</p>
                    </div>
                    <div>
                      <p className="text-gray-500">목표 습도</p>
                      <p className="font-bold text-green-700">{result.yolo.control.humidity_target}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">CO₂ 상한</p>
                      <p className="font-bold text-green-700">{result.yolo.control.co2_limit} ppm</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{result.yolo.control.desc}</p>
                </div>
              </div>
            )}

            {/* Claude 상세 분석 */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="font-bold text-gray-800">AI 상세 분석</h2>
              <div className="prose prose-green mt-4 max-w-none text-sm">
                <ReactMarkdown>{result.analysis}</ReactMarkdown>
              </div>
            </div>

            {/* 완료 버튼 */}
            <button
              onClick={handleReset}
              className="w-full rounded-xl border-2 border-green-700 py-3 font-semibold text-green-700 transition hover:bg-green-700 hover:text-white"
            >
              AI 분석 완료
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
