import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FILE =
  process.env.NODE_ENV === "production"
    ? "/tmp/sensor_log.json"
    : path.join(process.cwd(), "data", "sensor_log.json");

type TTNPayload = {
  end_device_ids?: { device_id?: string };
  received_at?: string;
  uplink_message?: {
    decoded_payload?: {
      temp?: number;
      humidity?: number;
      co2?: number;
      substrate_temp?: number;
    };
    rx_metadata?: { rssi?: number; snr?: number }[];
  };
};

export async function POST(req: NextRequest) {
  // TTN Webhook Secret 검증 (TTN 콘솔에서 설정한 값과 일치해야 함)
  const secret = req.headers.get("x-downlink-apikey") ?? req.headers.get("authorization");
  if (process.env.TTN_WEBHOOK_SECRET && secret !== process.env.TTN_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: TTNPayload = await req.json();
  const payload = body.uplink_message?.decoded_payload;

  if (!payload || payload.temp == null || payload.humidity == null || payload.co2 == null) {
    return NextResponse.json({ error: "decoded_payload 에 temp, humidity, co2 가 필요합니다." }, { status: 400 });
  }

  const rssi = body.uplink_message?.rx_metadata?.[0]?.rssi ?? null;
  const snr  = body.uplink_message?.rx_metadata?.[0]?.snr  ?? null;

  const entry = {
    time: new Date(body.received_at ?? Date.now()).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    receivedAt: body.received_at ?? new Date().toISOString(),
    deviceId: body.end_device_ids?.device_id ?? "unknown",
    temp: Number(payload.temp),
    humidity: Number(payload.humidity),
    co2: Number(payload.co2),
    substrate_temp: payload.substrate_temp != null ? Number(payload.substrate_temp) : null,
    rssi,
    snr,
  };

  const src = path.join(process.cwd(), "data", "sensor_log.json");
  const list = fs.existsSync(FILE)
    ? JSON.parse(fs.readFileSync(FILE, "utf-8"))
    : JSON.parse(fs.readFileSync(src, "utf-8"));

  list.push(entry);
  fs.writeFileSync(FILE, JSON.stringify(list.slice(-288), null, 2), "utf-8");

  console.log(`[TTN] ${entry.deviceId} → 온도 ${entry.temp}°C 습도 ${entry.humidity}% CO₂ ${entry.co2}ppm RSSI ${rssi}`);

  return NextResponse.json({ ok: true, entry });
}
