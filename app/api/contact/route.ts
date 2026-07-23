import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Vercel: /tmp 는 쓰기 가능한 임시 디렉토리 (재배포 시 초기화됨)
// 로컬: process.cwd()/data 사용
const FILE =
  process.env.NODE_ENV === "production"
    ? "/tmp/contacts.json"
    : path.join(process.cwd(), "data", "contacts.json");

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해 주세요." }, { status: 400 });
  }

  const entry = {
    id: Date.now(),
    name,
    email,
    message,
    createdAt: new Date().toISOString(),
  };

  let list: unknown[] = [];
  if (fs.existsSync(FILE)) {
    list = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  }
  list.push(entry);
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf-8");

  return NextResponse.json({ ok: true });
}
