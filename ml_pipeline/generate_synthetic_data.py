import pandas as pd
import numpy as np
import os
import random

# Seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_profile(label):
    """
    Generates a financial profile based on the class label.
    0: Risky, 1: Moderate, 2: Stable
    """
    if label == 2:  # STABLE
        income_regularity = np.random.uniform(0.85, 1.0)
        avg_monthly_income = np.random.normal(70000, 5000)
        savings_rate = np.random.uniform(0.20, 0.50)
        commitment_fulfillment = np.random.uniform(0.95, 1.0)
        spending_volatility = np.random.normal(0.1, 0.05)
        missed_commitments = np.random.poisson(0.1)
        income_growth_trend = np.random.normal(0.05, 0.02)
    elif label == 1:  # MODERATE
        income_regularity = np.random.uniform(0.60, 0.85)
        avg_monthly_income = np.random.normal(40000, 8000)
        savings_rate = np.random.uniform(0.05, 0.20)
        commitment_fulfillment = np.random.uniform(0.80, 0.95)
        spending_volatility = np.random.normal(0.3, 0.1)
        missed_commitments = np.random.poisson(1.0)
        income_growth_trend = np.random.normal(0.02, 0.03)
    else:  # RISKY
        income_regularity = np.random.uniform(0.30, 0.60)
        avg_monthly_income = np.random.normal(20000, 5000)
        savings_rate = np.random.uniform(-0.1, 0.05)
        commitment_fulfillment = np.random.uniform(0.50, 0.80)
        spending_volatility = np.random.normal(0.6, 0.2)
        missed_commitments = np.random.poisson(3.0)
        income_growth_trend = np.random.normal(-0.02, 0.05)

    # Derived features
    avg_monthly_spend = avg_monthly_income * (1 - savings_rate)
    discretionary_spending_ratio = np.random.uniform(0.1, 0.4) if label == 2 else np.random.uniform(0.4, 0.7)
    rent_ratio = np.random.uniform(0.15, 0.25)
    emi_ratio = np.random.uniform(0.0, 0.3)
    net_cashflow_stability = (income_regularity + commitment_fulfillment) / (1 + spending_volatility)

    return {
        "income_regularity": max(0, min(1, income_regularity)),
        "avg_monthly_income": max(0, avg_monthly_income),
        "income_growth_trend": income_growth_trend,
        "avg_monthly_spend": max(0, avg_monthly_spend),
        "discretionary_spending_ratio": max(0, min(1, discretionary_spending_ratio)),
        "savings_rate": savings_rate,
        "rent_ratio": max(0, min(1, rent_ratio)),
        "emi_ratio": max(0, min(1, emi_ratio)),
        "commitment_fulfillment_rate": max(0, min(1, commitment_fulfillment)),
        "missed_commitments_count": missed_commitments,
        "spending_volatility": max(0, spending_volatility),
        "net_cashflow_stability": max(0, net_cashflow_stability),
        "target": label
    }

def generate_dataset(num_rows):
    data = []
    # Mix of classes: 40% Stable, 40% Moderate, 20% Risky
    choices = [2] * 40 + [1] * 40 + [0] * 20
    for _ in range(num_rows):
        label = random.choice(choices)
        data.append(generate_profile(label))
    return pd.DataFrame(data)

def main():
    root_dir = r"c:\Users\prath\OneDrive\Desktop\New folder\ml_pipeline\data"
    train_dir = os.path.join(root_dir, "train")
    test_dir = os.path.join(root_dir, "test")

    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(test_dir, exist_ok=True)

    print("Generating training data...")
    for i in range(1, 8):
        df = generate_dataset(random.randint(300, 500))
        path = os.path.join(train_dir, f"train_{i}.csv")
        df.to_csv(path, index=False)
        print(f"Saved {path}")

    print("Generating testing data...")
    for i in range(1, 4):
        df = generate_dataset(random.randint(300, 500))
        path = os.path.join(test_dir, f"test_{i}.csv")
        df.to_csv(path, index=False)
        print(f"Saved {path}")

    print("Synthetic data generation complete.")

if __name__ == "__main__":
    main()
