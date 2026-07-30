"""
느타리버섯 병해/정상 분류 ResNet18 학습 스크립트
클래스: dataset.yaml 의 names 를 그대로 사용 (normal, 세균갈색무늬병, 푸른곰팡이병)
기존 YOLO용 images/labels 폴더를 그대로 재사용한다.
라벨 .txt(YOLO 포맷) 첫 줄의 class_id를 이미지 단위 클래스로 사용한다.
"""

from collections import Counter
from pathlib import Path

import torch
import torch.nn as nn
import yaml
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

# ── 경로 설정 ──────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
DATASET_YAML = Path(__file__).parent / "dataset.yaml"
CHECKPOINT_OUT = BASE_DIR / "best_resnet18.pt"

# ── 하이퍼파라미터 ─────────────────────────────────────────
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 30
LR = 1e-4
NUM_WORKERS = 4
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def load_dataset_config():
    with open(DATASET_YAML, encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    root = Path(cfg["path"])
    names = [cfg["names"][i] for i in sorted(cfg["names"])]
    return root, names


class MushroomDiseaseDataset(Dataset):
    """images/{split}/*.jpg + labels/{split}/{stem}.txt (YOLO 포맷) 재사용.
    라벨 파일 첫 줄의 class_id를 이미지 전체 클래스로 사용한다."""

    def __init__(self, root: Path, split: str, transform):
        img_dir = root / "images" / split
        lbl_dir = root / "labels" / split
        self.transform = transform
        self.samples: list[tuple[Path, int]] = []

        for img_path in sorted(img_dir.glob("*.jpg")):
            lbl_path = lbl_dir / f"{img_path.stem}.txt"
            if not lbl_path.exists():
                continue
            lines = lbl_path.read_text(encoding="utf-8").strip().splitlines()
            if not lines:
                continue
            class_id = int(lines[0].split()[0])
            self.samples.append((img_path, class_id))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, class_id = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        return self.transform(image), class_id


TRAIN_TRANSFORM = transforms.Compose([
    transforms.RandomResizedCrop(IMG_SIZE, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

EVAL_TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def build_model(num_classes: int):
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model.to(DEVICE)


def class_weights(dataset: MushroomDiseaseDataset, num_classes: int) -> torch.Tensor:
    """클래스 불균형 보정 (정상 이미지가 병해보다 훨씬 많은 경우 대비)."""
    counts = Counter(cls for _, cls in dataset.samples)
    total = len(dataset)
    weights = [total / (num_classes * counts.get(c, 1)) for c in range(num_classes)]
    return torch.tensor(weights, dtype=torch.float32, device=DEVICE)


def run_epoch(model, loader, criterion, optimizer=None):
    is_train = optimizer is not None
    model.train() if is_train else model.eval()

    total_loss, correct, total = 0.0, 0, 0
    with torch.set_grad_enabled(is_train):
        for images, labels in loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            loss = criterion(outputs, labels)

            if is_train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * images.size(0)
            correct += (outputs.argmax(1) == labels).sum().item()
            total += images.size(0)

    return total_loss / total, correct / total


def main():
    root, class_names = load_dataset_config()
    num_classes = len(class_names)

    print("=" * 60)
    print("ResNet18 느타리버섯 병해/정상 분류 학습 시작")
    print(f"데이터셋 : {root}")
    print(f"클래스   : {class_names}")
    print(f"디바이스 : {DEVICE}")
    print("=" * 60)

    train_ds = MushroomDiseaseDataset(root, "train", TRAIN_TRANSFORM)
    val_ds = MushroomDiseaseDataset(root, "val", EVAL_TRANSFORM)
    print(f"train: {len(train_ds)}장, val: {len(val_ds)}장")

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)

    model = build_model(num_classes)
    criterion = nn.CrossEntropyLoss(weight=class_weights(train_ds, num_classes))
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", patience=3)

    best_val_acc = 0.0
    for epoch in range(1, EPOCHS + 1):
        train_loss, train_acc = run_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc = run_epoch(model, val_loader, criterion)
        scheduler.step(val_acc)

        print(f"[{epoch:03d}/{EPOCHS}] train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
              f"val_loss={val_loss:.4f} val_acc={val_acc:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "model_state": model.state_dict(),
                "class_names": class_names,
                "img_size": IMG_SIZE,
            }, CHECKPOINT_OUT)
            print(f"  → best_resnet18.pt 갱신 (val_acc={val_acc:.4f})")

    print(f"\n학습 완료. 최고 val_acc={best_val_acc:.4f} → {CHECKPOINT_OUT}")
    print("테스트 확인: python classify_infer.py <이미지 경로>")


if __name__ == "__main__":
    main()
