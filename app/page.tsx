import Link from "next/link";

const stats = [
  { label: "테스트베드 규모", value: "1,200평" },
  { label: "AI 생육 정확도", value: "94.7%" },
  { label: "생산성 향상", value: "+38%" },
  { label: "에너지 절감", value: "-22%" },
];

const features = [
  {
    title: "AI 생육 관리",
    description:
      "머신러닝 기반 버섯 생육 상태 실시간 분석 및 최적 환경 자동 추천",
    icon: "🧠",
  },
  {
    title: "환경 자동제어",
    description:
      "온도·습도·CO₂·배지온도를 센서로 수집해 액추에이터를 자동 제어",
    icon: "⚙️",
  },
  {
    title: "실시간 대시보드",
    description: "모바일·PC에서 언제든 농장 현황을 모니터링하고 알림 수신",
    icon: "📊",
  },
  {
    title: "데이터 기반 의사결정",
    description: "누적 생산 데이터 분석으로 품종·주기별 수율 예측 및 개선",
    icon: "📈",
  },
];

export default function Home() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-green-900 to-green-700 px-8 py-32 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-300">
          IOTplus · 필리핀 스마트팜 실증 플랫폼
        </p>
        <h1 className="mt-4 text-5xl font-extrabold leading-tight md:text-6xl">
          AI Mushroom
          <br />
          Smart Farm
        </h1>
        <p className="mt-6 text-lg text-green-100">
          1,200평 테스트베드 기반의 AI 생육관리·환경제어·생산성 향상 시스템
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/technology"
            className="rounded-xl bg-white px-7 py-3 font-semibold text-green-800 transition hover:bg-green-50"
          >
            기술 소개 보기
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white px-7 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            대시보드 바로가기
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-50 px-8 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-extrabold text-green-800">{s.value}</p>
              <p className="mt-2 text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            핵심 기능
          </h2>
          <p className="mt-3 text-center text-gray-500">
            IOTplus 스마트팜 플랫폼이 제공하는 4가지 핵심 솔루션
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
              >
                <span className="text-4xl">{f.icon}</span>
                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-900 px-8 py-20 text-center text-white">
        <h2 className="text-3xl font-bold">지금 바로 시작하세요</h2>
        <p className="mt-4 text-green-200">
          IOTplus 팀과 함께 스마트팜 혁신을 경험해 보세요.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-green-900 transition hover:bg-green-50"
        >
          문의하기
        </Link>
      </section>
    </main>
  );
}
