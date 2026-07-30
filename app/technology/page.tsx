const techStack = [
  {
    category: "센서 & IoT",
    items: ["온·습도 센서", "CO₂ 센서", "배지온도 센서", "카메라 모듈"],
    icon: "📡",
  },
  {
    category: "AI / ML",
    items: ["생육 이미지 분석", "환경 예측 모델", "수율 예측 알고리즘", "이상 감지"],
    icon: "🧠",
  },
  {
    category: "백엔드 & DB",
    items: ["Next.js API Routes", "Supabase (PostgreSQL)", "실시간 구독", "엣지 함수"],
    icon: "🗄️",
  },
  {
    category: "프론트엔드",
    items: ["Next.js 15 App Router", "Tailwind CSS", "Recharts", "반응형 대시보드"],
    icon: "🖥️",
  },
];

const process = [
  {
    step: "01",
    title: "환경 데이터 수집",
    desc: "온도·습도·CO₂·배지온도를 IoT 센서로 5분 간격 수집해 클라우드에 저장",
  },
  {
    step: "02",
    title: "AI 분석",
    desc: "수집된 데이터를 ML 모델로 분석해 생육 상태 진단 및 최적 환경값 도출",
  },
  {
    step: "03",
    title: "자동 제어",
    desc: "분석 결과에 따라 냉난방·가습·환기 액추에이터를 자동으로 조작",
  },
  {
    step: "04",
    title: "모니터링 & 알림",
    desc: "대시보드에서 실시간 현황을 확인하고 이상 발생 시 즉시 알림 수신",
  },
];

export default function TechnologyPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-green-900 to-green-700 px-8 py-24 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-300">
          Technology
        </p>
        <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
          EMS + Smartfarm + Cold storage with AI
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-green-100">
          센서에서 AI 분석, 자동제어까지 — 버섯 재배 전 과정을 데이터로 연결합니다.
        </p>
      </section>

      {/* Process */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            작동 방식
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {process.map((p) => (
              <div
                key={p.step}
                className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-7 shadow-sm"
              >
                <span className="text-3xl font-extrabold text-green-200">
                  {p.step}
                </span>
                <div>
                  <h3 className="font-bold text-gray-900">{p.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-green-50 px-8 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            기술 스택
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {techStack.map((t) => (
              <div
                key={t.category}
                className="rounded-2xl bg-white p-8 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{t.icon}</span>
                  <h3 className="text-lg font-bold text-gray-900">
                    {t.category}
                  </h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {t.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spec */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            시스템 사양
          </h2>
          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["데이터 수집 주기", "5분 간격 (실시간 이벤트 알림 포함)"],
                  ["센서 채널 수", "온도 / 습도 / CO₂ / 배지온도 × 다수 구역"],
                  ["AI 모델 업데이트", "주 1회 자동 재학습"],
                  ["대시보드 지원 기기", "PC · 태블릿 · 모바일 (반응형)"],
                  ["데이터 보존 기간", "최소 3년 (클라우드 저장)"],
                  ["알림 채널", "이메일 · SMS · 카카오 알림톡 (예정)"],
                ].map(([key, val]) => (
                  <tr key={key} className="border-b last:border-0">
                    <td className="bg-green-50 px-6 py-4 font-medium text-gray-700 w-48">
                      {key}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
