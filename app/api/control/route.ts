import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type ControlState = {
  pump: boolean;
  fan: boolean;
};

const FILE =
  process.env.NODE_ENV === "production"
    ? "/tmp/control_state.json"
    : path.join(process.cwd(), "data", "control_state.json");

function readState(): ControlState {
  const src = path.join(process.cwd(), "data", "control_state.json");
  const from = fs.existsSync(FILE) ? FILE : src;
  return JSON.parse(fs.readFileSync(from, "utf-8"));
}

export async function GET() {
  return NextResponse.json(readState());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { device, state } = body;

  if (device !== "pump" && device !== "fan") {
    return NextResponse.json({ error: "device 는 pump 또는 fan 이어야 합니다." }, { status: 400 });
  }
  if (typeof state !== "boolean") {
    return NextResponse.json({ error: "state 는 boolean 이어야 합니다." }, { status: 400 });
  }

  const current = readState();
  const next = { ...current, [device]: state };
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2), "utf-8");

  return NextResponse.json(next);
}
