"""
느타리버섯 데이터셋 전처리 스크립트
- origin_data/ts1/diseases + growth 이미지
- label_data/tl1/diseases + growth JSON 어노테이션
- YOLO 형식으로 변환 후 train/val/test = 70/15/15 분할

추출 클래스 (3개):
  0: normal               (growth, NORMALITY=true)
  1: bacterial_brown_blotch (diseases, 세균갈색무늬병)
  2: blue_mold             (diseases, 푸른곰팡이병)
"""

import json
import os
import shutil
import random
from pathlib import Path

# ── 경로 설정 ──────────────────────────────────────────────
HACKATHON = Path(r"C:\Users\smhrd1\Desktop\WEB\smart-mushroom\new_datasets\hackathon_data")
IMG_ROOT   = HACKATHON / "origin_data" / "ts1"
LBL_ROOT   = HACKATHON / "label_data"  / "tl1"
OUT_ROOT   = Path(__file__).parent.parent / "dataset"   # smartfarm-web/dataset/

# ── 클래스 매핑 ────────────────────────────────────────────
CLASS_MAP = {
    "normal":                 0,
    "세균갈색무늬병":         1,
    "푸른곰팡이병":           2,
}

# ── 분할 비율 ──────────────────────────────────────────────
TRAIN_RATIO = 0.70
VAL_RATIO   = 0.15
# test = 나머지 0.15

SEED = 42

# ──────────────────────────────────────────────────────────
def bbox_to_yolo(x, y, w, h, img_w, img_h):
    """픽셀 절대좌표(좌상단 x,y + 크기 w,h) → YOLO 정규화 cx,cy,w,h"""
    cx = (x + w / 2) / img_w
    cy = (y + h / 2) / img_h
    nw = w / img_w
    nh = h / img_h
    return cx, cy, nw, nh


def load_samples(folder: str) -> list[dict]:
    """
    하나의 폴더(diseases 또는 growth)에서
    { img_path, class_id, annotations } 목록 반환
    """
    img_dir = IMG_ROOT / folder
    lbl_dir = LBL_ROOT / folder
    samples = []

    for jf in sorted(lbl_dir.glob("*.json")):
        with open(jf, encoding="utf-8") as f:
            data = json.load(f)

        meta       = data["META"]
        image_info = data["IMAGE"]
        annots     = data.get("ANNOTATION_INFO", [])

        img_w = image_info["WIDTH"]
        img_h = image_info["HEIGHT"]
        img_name = image_info["IMAGE_FILE_NAME"]
        img_path = img_dir / img_name

        if not img_path.exists():
            continue

        # 클래스 결정
        normality = meta.get("DBYHS_NORMALITY_ALTERNATIVE", True)
        spchckn   = meta.get("DBYHS_SPCHCKN")

        if normality:
            class_id = CLASS_MAP["normal"]
        elif spchckn == "푸른곰팡이병":
            class_id = CLASS_MAP["푸른곰팡이병"]
        else:
            class_id = CLASS_MAP["세균갈색무늬병"]

        # bbox 변환
        yolo_lines = []
        for ann in annots:
            x = ann["BOUNDING_BOX_X_COORDINATE"]
            y = ann["BOUNDING_BOX_Y_COORDINATE"]
            w = ann["BOUNDING_BOX_WIDTH"]
            h = ann["BOUNDING_BOX_HEIGHT"]
            cx, cy, nw, nh = bbox_to_yolo(x, y, w, h, img_w, img_h)
            yolo_lines.append(f"{class_id} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")

        if not yolo_lines:
            continue

        samples.append({
            "img_path":   img_path,
            "img_name":   img_name,
            "class_id":   class_id,
            "yolo_lines": yolo_lines,
        })

    return samples


def split(samples: list[dict]) -> tuple[list, list, list]:
    random.seed(SEED)
    random.shuffle(samples)
    n      = len(samples)
    n_train = int(n * TRAIN_RATIO)
    n_val   = int(n * VAL_RATIO)
    return (
        samples[:n_train],
        samples[n_train : n_train + n_val],
        samples[n_train + n_val :],
    )


def write_split(samples: list[dict], split_name: str):
    img_out = OUT_ROOT / "images" / split_name
    lbl_out = OUT_ROOT / "labels" / split_name
    img_out.mkdir(parents=True, exist_ok=True)
    lbl_out.mkdir(parents=True, exist_ok=True)

    for s in samples:
        # 이미지 복사
        dst_img = img_out / s["img_name"]
        shutil.copy2(s["img_path"], dst_img)
        # 라벨 저장
        stem = Path(s["img_name"]).stem
        with open(lbl_out / f"{stem}.txt", "w") as f:
            f.write("\n".join(s["yolo_lines"]))


def main():
    print("=" * 60)
    print("느타리버섯 YOLO 데이터셋 전처리 시작")
    print(f"출력 경로: {OUT_ROOT}")
    print("=" * 60)

    # 데이터 로드
    print("\n[1/4] JSON 파일 파싱 중...")
    growth_samples   = load_samples("growth")
    diseases_samples = load_samples("diseases")
    all_samples      = growth_samples + diseases_samples

    # 클래스별 통계
    from collections import Counter
    cls_counter = Counter(s["class_id"] for s in all_samples)
    id_to_name = {v: k for k, v in CLASS_MAP.items()}
    print("\n클래스별 이미지 수:")
    for cid, cnt in sorted(cls_counter.items()):
        print(f"  [{cid}] {id_to_name[cid]:<25} {cnt:>5}장")
    print(f"  {'합계':<26} {len(all_samples):>5}장")

    # 분할
    print("\n[2/4] 70/15/15 분할 중...")
    # 클래스 불균형 고려: 클래스별로 분할 후 합침
    train_all, val_all, test_all = [], [], []
    for cid in sorted(cls_counter):
        subset = [s for s in all_samples if s["class_id"] == cid]
        tr, va, te = split(subset)
        train_all += tr
        val_all   += va
        test_all  += te

    print(f"  train: {len(train_all):>5}장")
    print(f"  val  : {len(val_all):>5}장")
    print(f"  test : {len(test_all):>5}장")

    # 파일 출력
    print("\n[3/4] 이미지 복사 + 라벨 저장 중...")
    for split_name, samples in [("train", train_all), ("val", val_all), ("test", test_all)]:
        print(f"  {split_name} ...", end=" ", flush=True)
        write_split(samples, split_name)
        print("완료")

    # dataset.yaml 생성
    print("\n[4/4] dataset.yaml 생성...")
    yaml_path = OUT_ROOT / "dataset.yaml"
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(f"path: {OUT_ROOT.as_posix()}\n")
        f.write("train: images/train\n")
        f.write("val:   images/val\n")
        f.write("test:  images/test\n\n")
        f.write(f"nc: {len(CLASS_MAP)}\n")
        f.write("names:\n")
        for name, cid in sorted(CLASS_MAP.items(), key=lambda x: x[1]):
            f.write(f"  {cid}: {name}\n")
    print(f"  저장: {yaml_path}")

    # python/dataset.yaml도 업데이트
    py_yaml = Path(__file__).parent / "dataset.yaml"
    with open(py_yaml, "w", encoding="utf-8") as f:
        f.write(f"path: {OUT_ROOT.as_posix()}\n")
        f.write("train: images/train\n")
        f.write("val:   images/val\n\n")
        f.write(f"nc: {len(CLASS_MAP)}\n")
        f.write("names:\n")
        for name, cid in sorted(CLASS_MAP.items(), key=lambda x: x[1]):
            f.write(f"  {cid}: {name}\n")

    print("\n완료!")
    print(f"\n다음 단계: python train.py")


if __name__ == "__main__":
    main()
