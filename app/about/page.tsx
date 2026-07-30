const team = [
  {
    name: "한형률상무이사",
    role: "PM",
    desc: "필리핀 실증 테스트베드 프로젝트 총괄",
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
  { year: "2025", event: " Acquired ISO 14001 & ISO 9001 Certifications" },
  { year: "2024", event: " Selected for the [2024 Research-and-Development Innopolis Foster (R&D) Project] " },
  { year: "2023", event: " Acquired ISO 14001 & ISO 9001 Certifications \n Acquired [KEPCO Trusted Partner (KTP)] certification from the Korea Electric Power Corporation (KEPCO)" },
  { year: "2022", event: " Patent Transfer: Transferred patent from the Korea Institute of Energy Research" },
  { year: "2021", event: " Establishment of an In-House Corporate Research Institute" },
  { year: "2020", event: "IOTPLUS Co., Ltd Established in" },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-green-900 to-green-700 px-8 py-24 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-300">
          About Platform
        </p>
        <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
          SmartFarm
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-green-100">
          AI·IoT 기술을 기반으로 에너지(EMS)와 콜드스토리지 및 스마트팜
          구축·운영중.
                </p>
      </section>

      {/* Mission */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">미션</h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            To establish and demonstrate an intelligent, energy-self-sufficient cold-chain system that integrates renewable energy, energy storage, heat pumps, and AI-based energy management, thereby reducing food loss and enabling reliable cold storage in regions with unstable power infrastructure.
            <br />
            <br />
            재생에너지와 AI 기반 열·전기 통합관리 기술을 활용하여 전력 인프라가 취약한 지역에서도 안정적으로 운영되는 에너지 자립형 저온시설을 구축하고, 농수산물 손실을 줄이는 지속가능한 콜드체인 사업모델을 실증·확산하는 것입니다.
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
                  <p className="whitespace-pre-line text-gray-800">{m.event}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Team */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">팀원</h2>
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
