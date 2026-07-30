"""
ResNet18 병해/정상 분류 추론 모듈.
main.py(FastAPI 서버)와 CLI 단독 테스트에서 공용으로 사용한다.
"""

from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms

BASE_DIR = Path(__file__).parent.parent
CHECKPOINT_PATH = BASE_DIR / "best_resnet18.pt"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# 클래스명 → 화면 표시용 한글 라벨
DISPLAY_NAMES = {
    "normal": "정상",
    "세균갈색무늬병": "세균갈색무늬병",
    "푸른곰팡이병": "푸른곰팡이병",
}


def _build_transform(img_size: int):
    return transforms.Compose([
        transforms.Resize(int(img_size * 256 / 224)),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


class DiseaseClassifier:
    def __init__(self, checkpoint_path: Path = CHECKPOINT_PATH):
        if not checkpoint_path.exists():
            raise FileNotFoundError(
                f"체크포인트 없음: {checkpoint_path}\n"
                "먼저 python classify_train.py 로 모델을 학습하세요."
            )
        ckpt = torch.load(checkpoint_path, map_location=DEVICE)
        self.class_names: list[str] = ckpt["class_names"]
        self.transform = _build_transform(ckpt["img_size"])

        self.model = models.resnet18(weights=None)
        self.model.fc = torch.nn.Linear(self.model.fc.in_features, len(self.class_names))
        self.model.load_state_dict(ckpt["model_state"])
        self.model.to(DEVICE).eval()

    @torch.no_grad()
    def predict(self, image: Image.Image) -> dict:
        tensor = self.transform(image.convert("RGB")).unsqueeze(0).to(DEVICE)
        logits = self.model(tensor)
        probs = F.softmax(logits, dim=1)[0].cpu().tolist()

        best_idx = max(range(len(probs)), key=lambda i: probs[i])
        best_class = self.class_names[best_idx]

        return {
            "class": best_class,
            "class_kr": DISPLAY_NAMES.get(best_class, best_class),
            "is_disease": best_class != "normal",
            "confidence": round(probs[best_idx], 4),
            "probabilities": {
                name: round(p, 4) for name, p in zip(self.class_names, probs)
            },
        }


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("사용법: python classify_infer.py <이미지 경로>")
        raise SystemExit(1)

    classifier = DiseaseClassifier()
    result = classifier.predict(Image.open(sys.argv[1]))
    print(result)
