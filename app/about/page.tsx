const team = [
  {
    name: "황현구",
    role: "PM · 시스템 아키텍처",
    desc: "IoT 플랫폼 설계 및 스마트팜 비즈니스 총괄",
  },
  {
    name: "AI 생육 전문가",
    role: "농업 AI 연구",
    desc: "버섯 생육 데이터 분석 및 머신러닝 모델 개발",
  },
  {
    name: "현지 운영팀",
    role: "필리핀 테스트베드 운영",
    desc: "1,200평 실증 농장 현장 관리 및 데이터 수집",
  },
];

const milestones = [
  { year: "2023", event: "IOTplus 창업 및 스마트팜 R&D 시작" },
  { year: "2024", event: "필리핀 현지 파트너십 체결 및 테스트베드 착공" },
  { year: "2025", event: "1,200평 버섯 스마트팜 실증 운영 개시" },
  { year: "2026", event: "AI 생육관리 시스템 고도화 및 사업 확장" },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-green-900 to-green-700 px-8 py-24 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-300">
          About IOTplus
        </p>
        <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
          농업의 미래를 기술로 만듭니다
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-green-100">
          IOTplus는 AI·IoT 기술을 기반으로 필리핀 버섯 스마트팜 실증 플랫폼을
          구축·운영하는 농업 기술 기업입니다.
        </p>
      </section>

      {/* Mission */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">미션</h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            개발도상국 농업 현장에 AI·IoT 기술을 접목해 생산성과 수익성을
            함께 높이고, 지속 가능한 식량 생산 모델을 실증합니다.
            <br />
            <br />
            1,200평 테스트베드를 통해 검증된 기술을 동남아시아 전역으로
            확산하는 것이 IOTplus의 목표입니다.
          </p>
        </div>
      </section>

      {/* Milestones */}
      <section className="bg-green-50 px-8 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            연혁
          </h2>
          <ol className="mt-12 space-y-8">
            {milestones.map((m) => (
              <li key={m.year} className="flex gap-6">
                <span className="w-16 shrink-0 text-right text-lg font-extrabold text-green-700">
                  {m.year}
                </span>
                <div className="flex flex-col gap-1 border-l-2 border-green-300 pl-6">
                  <p className="text-gray-800">{m.event}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Team */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">팀</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                  👤
                </div>
                <h3 className="font-bold text-gray-900">{member.name}</h3>
                <p className="mt-1 text-sm font-medium text-green-700">
                  {member.role}
                </p>
                <p className="mt-3 text-sm text-gray-500">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
