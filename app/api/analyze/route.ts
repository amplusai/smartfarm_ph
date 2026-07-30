import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const client = new Anthropic();
const CLASSIFY_SERVER = process.env.CLASSIFY_SERVER_URL ?? "http://localhost:8000";

type ClassificationResult = {
  class: string;
  class_kr: string;
  is_disease: boolean;
  confidence: number;
  probabilities: Record<string, number>;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "이미지가 없습니다." }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = imageFile.type as "image/jpeg" | "image/png" | "image/webp";

    // 현재 센서 데이터
    const sensorPath = path.join(process.cwd(), "data", "sensor_log.json");
    const sensorRows = JSON.parse(fs.readFileSync(sensorPath, "utf-8"));
    const sensor = sensorRows[sensorRows.length - 1];

    // ResNet18 병해/정상 분류 (FastAPI 서버가 실행 중이면 사용, 아니면 skip)
    let classification: ClassificationResult | null = null;
    try {
      const classifyForm = new FormData();
      classifyForm.append("file", new Blob([bytes], { type: imageFile.type }), imageFile.name);
      const classifyRes = await fetch(`${CLASSIFY_SERVER}/analyze`, {
        method: "POST",
        body: classifyForm,
        signal: AbortSignal.timeout(5000),
      });
      if (classifyRes.ok) classification = await classifyRes.json();
    } catch {
      // 분류 서버 미실행 시 Claude만 사용
    }

    const classificationContext = classification
      ? `\nResNet18 병해 분류 결과: ${classification.class_kr} (신뢰도 ${(classification.confidence * 100).toFixed(1)}%)`
      : "";

    // Claude Vision 상세 분석
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `당신은 느타리버섯 재배 전문 AI입니다.${classificationContext}

현재 재배사 환경 센서:
- 온도: ${sensor.temp}°C  습도: ${sensor.humidity}%  CO₂: ${sensor.co2}ppm  배지온도: ${sensor.substrate_temp}°C

업로드된 버섯 이미지를 분석하여 다음 형식으로 답변해주세요:

## 🍄 생육 단계
(균사배양 / 초발이 / 발이 / 생육 / 수확적기 / 과숙 중 하나 + 근거)

## 🩺 병해 진단
(ResNet18 분류 결과를 참고하여 병해 여부와 종류, 육안 근거를 설명)

## 📊 생육 상태 평가
(현재 상태 장단점, 이상 징후 여부)

## 🌡️ IoT 센서 제어 권장값
| 항목 | 현재값 | 권장값 | 조치 |
|------|--------|--------|------|
| 온도 | ${sensor.temp}°C | ?°C | 유지/올리기/내리기 |
| 습도 | ${sensor.humidity}% | ?% | 유지/가습기ON/가습기OFF |
| CO₂ | ${sensor.co2}ppm | ?ppm | 유지/환기팬ON/환기팬OFF |
| 배지온도 | ${sensor.substrate_temp}°C | ?°C | 유지/조정 |

## ✅ 즉시 조치 사항
(우선순위 순으로 3가지)

## 📅 향후 3일 관리 포인트`,
            },
          ],
        },
      ],
    });

    const analysis = (response.content[0] as { type: string; text: string }).text;
    return NextResponse.json({ analysis, sensor, classification });
  } catch (error) {
    console.error("분석 오류:", error);
    return NextResponse.json({ error: "분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
