from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import os

app = FastAPI(title="SmartFarm YOLO API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# 기본값: 프로젝트 루트의 best.pt (YOLO11s 학습 결과)
_DEFAULT_MODEL = os.path.join(os.path.dirname(__file__), "..", "best.pt")
MODEL_PATH = os.getenv("YOLO_MODEL_PATH", _DEFAULT_MODEL)
model = YOLO(MODEL_PATH)

# 버섯 생육단계별 최적 센서 제어값
STAGE_CONTROL = {
    "발아기": {
        "temp_target": 23.0,
        "humidity_target": 92,
        "co2_limit": 1000,
        "desc": "균사 활착 단계. 고습·적온 유지 필요.",
    },
    "성장기": {
        "temp_target": 21.0,
        "humidity_target": 87,
        "co2_limit": 800,
        "desc": "자실체 형성 단계. 환기량을 늘려 CO₂ 억제.",
    },
    "수확기": {
        "temp_target": 19.0,
        "humidity_target": 82,
        "co2_limit": 600,
        "desc": "수확 직전. 온도를 낮춰 품질 유지.",
    },
    "이상감지": {
        "temp_target": 20.0,
        "humidity_target": 85,
        "co2_limit": 700,
        "desc": "오염 또는 생육 불량 의심. 즉시 점검 필요.",
    },
}


def classify_stage(detections: list[dict]) -> str:
    """
    YOLO11s 검출 결과에서 가장 높은 confidence의 클래스를 생육단계로 반환.
    모델 클래스명이 STAGE_CONTROL 키와 일치해야 한다.
    """
    if not detections:
        return "발아기"

    best = max(detections, key=lambda d: d["confidence"])
    label = best["label"]
    return label if label in STAGE_CONTROL else "이상감지"


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    results = model(image, verbose=False)[0]

    detections = []
    img_w, img_h = image.size
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        detections.append({
            "label": results.names[int(box.cls[0])],
            "confidence": round(float(box.conf[0]), 3),
            "x": round(x1 / img_w, 4),
            "y": round(y1 / img_h, 4),
            "width":  round((x2 - x1) / img_w, 4),
            "height": round((y2 - y1) / img_h, 4),
        })

    stage = classify_stage(detections)
    control = STAGE_CONTROL[stage]

    return {
        "stage": stage,
        "detections": detections,
        "control": control,
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_PATH}
