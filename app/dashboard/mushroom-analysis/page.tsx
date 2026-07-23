"use client";

import { useState, useRef } from "react";
import Image from "next/image";

type AnalysisResult = {
  analysis: string;
  sensor: {
    temp: number;
    humidity: number;
    co2: number;
    substrate_temp: number;
  };
};

export default function MushroomAnalysisPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 마크다운 간단 렌더링
  function renderMarkdown(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <h2 key={i} className="mt-6 mb-2 text-lg font-bold text-green-700">{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("| ")) {
        return <p key={i} className="font-mono text-sm text-gray-700">{line}</p>;
      }
      if (line.startsWith("- ") || line.startsWith("(")) {
        return <p key={i} className="text-sm text-gray-600 ml-2">{line}</p>;
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-sm text-gray-700">{line}</p>;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🍄 버섯 생육 AI 분석</h1>
          <p className="mt-2 text-gray-500">
            느타리버섯 사진을 업로드하면 AI가 생육 상태를 분석하고 IoT 제어 권장값을 제공합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {/* 업로드 영역 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-700 mb-4">📷 버섯 이미지 업로드</h2>

            <div
              className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center cursor-pointer hover:bg-green-50 transition"
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {preview ? (
                <div className="relative h-48 w-full">
                  <Image src={preview} alt="preview" fill className="object-contain rounded-lg" />
                </div>
              ) : (
                <div className="py-8">
                  <p className="text-4xl mb-3">🌿</p>
                  <p className="text-gray-500 text-sm">클릭하거나 이미지를 드래그하세요</p>
                  <p className="text-gray-400 text-xs mt-1">JPG, PNG, WEBP 지원</p>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {file && (
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "AI 분석 중..." : "🔍 생육 상태 분석하기"}
              </button>
            )}

            {error && (
              <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
            )}
          </div>

          {/* 현재 센서값 */}
          {result && (
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-gray-700 mb-4">📡 현재 센서 데이터</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "온도", value: `${result.sensor.temp}°C`, icon: "🌡️" },
                  { label: "습도", value: `${result.sensor.humidity}%`, icon: "💧" },
                  { label: "CO₂", value: `${result.sensor.co2} ppm`, icon: "💨" },
                  { label: "배지온도", value: `${result.sensor.substrate_temp}°C`, icon: "🌱" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-green-50 p-4 text-center">
                    <p className="text-2xl">{item.icon}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                    <p className="text-lg font-bold text-green-700">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 분석 결과 */}
        {result && (
          <div className="mt-6 bg-white rounded-2xl shadow p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">🤖 AI 분석 결과</h2>
              <button
                onClick={() => {
                  const blob = new Blob([result.analysis], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `버섯분석_${new Date().toLocaleDateString("ko-KR").replace(/\. /g, "-").replace(".", "")}.txt`;
                  a.click();
                }}
                className="rounded-lg border border-green-600 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                📄 문서 저장
              </button>
            </div>
            <div className="prose prose-sm max-w-none border-t pt-4">
              {renderMarkdown(result.analysis)}
            </div>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="mt-6 bg-white rounded-2xl shadow p-12 text-center">
            <p className="text-4xl animate-bounce">🍄</p>
            <p className="mt-4 text-gray-500">Claude AI가 버섯 생육 상태를 분석 중입니다...</p>
            <p className="text-sm text-gray-400 mt-1">약 10~20초 소요됩니다</p>
          </div>
        )}

      </div>
    </div>
  );
}
