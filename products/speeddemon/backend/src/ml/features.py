"""Feature engineering helpers for SpeedDemon.

Convert Gold tables into arrays/tensors suitable for training.
"""

import pandas as pd
from typing import Any


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Return a features DataFrame from cleaned gold data.

    Args:
        df: analytics-ready DataFrame

    Returns:
        DataFrame of features
    """
    # TODO: implement domain-specific feature engineering
    return df.copy()


if __name__ == "__main__":
    import pandas as pd
    print(build_features(pd.DataFrame()))
