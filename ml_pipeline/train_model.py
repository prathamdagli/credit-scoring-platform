import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
import joblib
import os
import glob

def load_data(data_dir):
    files = glob.glob(os.path.join(data_dir, "*.csv"))
    dfs = [pd.read_csv(f) for f in files]
    return pd.concat(dfs, ignore_index=True)

def main():
    base_dir = r"c:\Users\prath\OneDrive\Desktop\New folder\ml_pipeline"
    train_data_dir = os.path.join(base_dir, "data", "train")
    test_data_dir = os.path.join(base_dir, "data", "test")
    model_dir = os.path.join(base_dir, "models")
    
    os.makedirs(model_dir, exist_ok=True)

    print("Loading data...")
    train_df = load_data(train_data_dir)
    test_df = load_data(test_data_dir)

    X_train = train_df.drop("target", axis=1)
    y_train = train_df["target"]
    X_test = test_df.drop("target", axis=1)
    y_test = test_df["target"]

    print(f"Training on {len(X_train)} rows...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        objective="multi:softprob",
        num_class=3,
        random_state=42
    )
    
    model.fit(X_train, y_train)

    print("Evaluating model...")
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba, multi_class="ovr")

    print(f"Accuracy: {accuracy:.4f}")
    print(f"ROC-AUC: {roc_auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    model_path = os.path.join(model_dir, "model.pkl")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    main()
