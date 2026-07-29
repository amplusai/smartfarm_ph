import { TemperatureHumidityChart, CO2Chart } from "@/components/SensorChart";
import { ActuatorControls } from "@/components/ActuatorControls";
import Link from "next/link";
import fs from "fs";
import path from "path";

type SensorRow = {
  time: string;
  temp: number;
  humidity: number;
  co2: number;
  substrate_temp: number;
  wind_speed: number;
};

function getLatest(): SensorRow {
  const filePath = path.join(process.cwd(), "data", "sensor_log.json");
  const rows: SensorRow[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return rows[rows.length - 1];
}

export default function DashboardPage() {
  const latest = getLatest();

  const sensorData = [
    { label: "온도", value: `${latest.temp}°C`, status: latest.temp > 26 ? "주의" : "정상", warn: latest.temp > 26 },
    { label: "습도", value: `${latest.humidity}%`, status: latest.humidity < 80 ? "주의" : "정상", warn: latest.humidity < 80 },
    { label: "CO₂", value: `${latest.co2} ppm`, status: latest.co2 > 950 ? "주의" : "정상", warn: latest.co2 > 950 },
    { label: "배지온도", value: `${latest.substrate_temp}°C`, status: latest.substrate_temp > 25 ? "주의" : "정상", warn: latest.substrate_temp > 25 },
    { label: "풍속", value: `${latest.wind_speed}m/s`, status: latest.wind_speed < 0.2 ? "주의" : "정상", warn: latest.wind_speed < 0.2 },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-green-900">
            Smart Farm Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/mushroom-analysis"
              className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500"
            >
              🍄 AI 생육 분석
            </Link>
            <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
              실시간 모니터링
            </span>
          </div>
        </div>

        {/* 센서 카드 */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {sensorData.map((item) => (
            <div key={item.label} className="rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{item.value}</p>
              <p className={`mt-1 text-xs font-medium ${item.warn ? "text-yellow-600" : "text-green-600"}`}>
                {item.status}
              </p>
            </div>
          ))}
        </div>

        {/* 차트 */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-800">온도 · 습도 추이 (24h)</h2>
            <TemperatureHumidityChart />
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-800">CO₂ 농도 추이 (24h)</h2>
            <CO2Chart />
          </div>
        </div>

        {/* 장치 제어 */}
        <ActuatorControls />

        {/* 구역별 상태 */}
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">구역별 상태</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {["A구역", "B구역", "C구역", "D구역"].map((zone, i) => (
              <div key={zone} className="rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-sm font-medium text-gray-700">{zone}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    i === 2
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {i === 2 ? "점검 필요" : "정상 운영"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
