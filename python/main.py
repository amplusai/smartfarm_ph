import io

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from classify_infer import DiseaseClassifier

app = FastAPI(title="SmartFarm Disease Classification API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

classifier = DiseaseClassifier()


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    return classifier.predict(image)


@app.get("/health")
def health():
    return {"status": "ok", "classes": classifier.class_names}
