"""Training loop placeholder for SpeedDemon.

Implements a minimal train workflow that consumes feature data and fits a model.
"""

from .model_logic import create_model, save_model
import pandas as pd
from typing import Any


def train(features: pd.DataFrame, target: pd.Series, out_path: str = "models/model.pkl") -> Any:
    model = create_model()
    if len(features) == 0:
        print("Warning: empty feature set; skipping fit")
        return model
    model.fit(features, target)
    save_model(model, out_path)
    return model


if __name__ == "__main__":
    print("Run `train()` with real data")
