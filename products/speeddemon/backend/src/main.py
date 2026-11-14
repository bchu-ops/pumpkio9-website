"""Orchestrator placeholder: runs ELT -> ML pipeline."""

# from data_pipeline import extract, load, transform
# from ml import train, features as feat

import pandas as pd
print(pd.DataFrame({"a": [1, 2, 3]}))

# def main():
#     raw = extract.extract("example_source")
#     cleaned = transform.transform(raw)
#     out = load.load_to_bronze(cleaned)
#     print(f"Saved bronze: {out}")

#     # Placeholder: convert to features and run training
#     import pandas as pd
#     X = feat.build_features(pd.DataFrame())
#     y = pd.Series([])
#     model = train.train(X, y)
#     print("Finished pipeline")


# if __name__ == "__main__":
#     main()

print("hi")