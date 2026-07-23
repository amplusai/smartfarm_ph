"""
느타리버섯 생육상태 분류 YOLO11s 학습 스크립트
클래스: normal, dry, over_humidity, co2_high, harvest_ready,
        bacterial_brown_blotch, blue_mold, other_disease
"""

import os
from pathlib import Path
from ultralytics import YOLO

# ── 경로 설정 ──────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent.parent          # 프로젝트 루트
DATASET    = BASE_DIR / "python" / "dataset.yaml"
OUTPUT_DIR = BASE_DIR / "runs"

# ── 하이퍼파라미터 ─────────────────────────────────────────
CFG = dict(
    model      = "yolo11s.pt",   # 사전학습 가중치 (없으면 자동 다운로드)
    data       = str(DATASET),
    epochs     = 100,
    imgsz      = 640,
    batch      = 16,             # GPU 메모리에 따라 8/16/32 조정
    lr0        = 0.01,           # 초기 학습률
    lrf        = 0.01,           # 최종 학습률 (lr0 × lrf)
    momentum   = 0.937,
    weight_decay = 0.0005,
    warmup_epochs = 3,
    patience   = 20,             # Early stopping: 20 epoch 개선 없으면 중단
    device     = 0,              # GPU 0번. CPU만 있으면 "cpu"로 변경
    workers    = 4,
    project    = str(OUTPUT_DIR),
    name       = "mushroom_yolo11s",
    exist_ok   = True,
    pretrained = True,
    optimizer  = "SGD",
    seed       = 42,
    # ── 데이터 증강 ──────────────────────────────────────
    hsv_h      = 0.015,          # 색조 변화
    hsv_s      = 0.7,            # 채도 변화
    hsv_v      = 0.4,            # 명도 변화
    degrees    = 10.0,           # 회전 (-10 ~ +10도)
    translate  = 0.1,            # 이동
    scale      = 0.5,            # 크기 변화
    fliplr     = 0.5,            # 좌우 반전
    flipud     = 0.0,            # 상하 반전 (버섯은 방향 중요)
    mosaic     = 1.0,            # 모자이크 증강
    mixup      = 0.1,            # MixUp 증강
)


def main():
    print("=" * 60)
    print("YOLO11s 느타리버섯 분류 모델 학습 시작")
    print(f"데이터셋 : {DATASET}")
    print(f"출력 경로: {OUTPUT_DIR / 'mushroom_yolo11s'}")
    print("=" * 60)

    if not DATASET.exists():
        raise FileNotFoundError(
            f"dataset.yaml 없음: {DATASET}\n"
            "dataset/ 폴더 구조를 먼저 준비하세요.\n"
            "  dataset/images/train/*.jpg\n"
            "  dataset/images/val/*.jpg\n"
            "  dataset/labels/train/*.txt\n"
            "  dataset/labels/val/*.txt"
        )

    model = YOLO(CFG.pop("model"))
    results = model.train(**CFG)

    # 학습 완료 후 best.pt를 프로젝트 루트로 복사
    best_src = Path(results.save_dir) / "weights" / "best.pt"
    best_dst = BASE_DIR / "best.pt"
    if best_src.exists():
        import shutil
        shutil.copy2(best_src, best_dst)
        print(f"\n best.pt → {best_dst}")

    # 검증 실행
    print("\n[검증]")
    metrics = model.val()
    print(f"mAP50    : {metrics.box.map50:.4f}")
    print(f"mAP50-95 : {metrics.box.map:.4f}")

    print("\n클래스별 AP:")
    for i, name in enumerate(model.names.values()):
        ap = metrics.box.ap50[i] if i < len(metrics.box.ap50) else float("nan")
        print(f"  [{i}] {name:<30} AP50={ap:.4f}")


if __name__ == "__main__":
    main()
