import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FILE =
  process.env.NODE_ENV === "production"
    ? "/tmp/sensor_log.json"
    : path.join(process.cwd(), "data", "sensor_log.json");

export async function GET() {
  const src = process.env.NODE_ENV === "production" && fs.existsSync(FILE)
    ? FILE
    : path.join(process.cwd(), "data", "sensor_log.json");
  const raw = fs.readFileSync(src, "utf-8");
  return NextResponse.json(JSON.parse(raw));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { temp, humidity, co2, substrate_temp } = body;

  if (temp == null || humidity == null || co2 == null) {
    return NextResponse.json({ error: "temp, humidity, co2 는 필수입니다." }, { status: 400 });
  }

  const entry = {
    time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
    temp: Number(temp),
    humidity: Number(humidity),
    co2: Number(co2),
    substrate_temp: substrate_temp != null ? Number(substrate_temp) : null,
  };

  const src = path.join(process.cwd(), "data", "sensor_log.json");
  const list = fs.existsSync(FILE)
    ? JSON.parse(fs.readFileSync(FILE, "utf-8"))
    : JSON.parse(fs.readFileSync(src, "utf-8"));

  list.push(entry);

  // 최근 288개만 유지 (5분 간격 × 24h)
  const trimmed = list.slice(-288);
  fs.writeFileSync(FILE, JSON.stringify(trimmed, null, 2), "utf-8");

  return NextResponse.json({ ok: true, entry });
}
