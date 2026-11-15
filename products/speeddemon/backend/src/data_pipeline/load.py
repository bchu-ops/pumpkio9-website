"""Data loading placeholders for SpeedDemon.

Responsible for persisting raw files into `storage/bronze`.
"""

from pathlib import Path


def load_to_bronze(payload, path: str = "storage/bronze") -> Path:
    """Write `payload` to a file in the bronze layer and return path.

    This is a lightweight placeholder that should be replaced with
    robust serialization (parquet, partitioning, etc.).
    """
    Path(path).mkdir(parents=True, exist_ok=True)
    out = Path(path) / "sample_raw.json"
    with out.open("w", encoding="utf-8") as fh:
        fh.write(str(payload))
    return out


if __name__ == "__main__":
    print(load_to_bronze({"example": 1}))
