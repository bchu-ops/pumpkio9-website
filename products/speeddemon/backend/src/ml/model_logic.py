"""Model architecture and utility functions for SpeedDemon.

Provide simple model creation and prediction wrappers.
"""

from sklearn.linear_model import Ridge
from typing import Any


def create_model(alpha: float = 1.0) -> Any:
    """Return an instantiated model (placeholder)."""
    return Ridge(alpha=alpha)


def save_model(model, path: str):
    """Persist model to disk (placeholder)."""
    import joblib
    joblib.dump(model, path)


if __name__ == "__main__":
    m = create_model()
    print(type(m), m.get_params())
