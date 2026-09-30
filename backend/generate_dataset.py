"""
Generate a synthetic credit card fraud detection dataset.

This script creates a CSV file with the same structure as the well-known
ULB creditcard.csv dataset (Time, V1-V28, Amount, Class) using synthetic
data with realistic fraud signatures.

Usage:
    python generate_dataset.py --rows 5000 --fraud-rate 0.05 --output creditcard.csv
"""

import argparse
import numpy as np
import pandas as pd


def generate_dataset(n_rows: int, fraud_rate: float, seed: int = 42) -> pd.DataFrame:
    """Generate a synthetic credit card transaction dataset."""
    rng = np.random.default_rng(seed)
    n_fraud = int(n_rows * fraud_rate)
    n_normal = n_rows - n_fraud

    feature_cols = [f"V{i}" for i in range(1, 29)]

    # Normal transactions: mean=0, std=1 for all V features
    normal_data = rng.standard_normal((n_normal, 28))
    normal_df = pd.DataFrame(normal_data, columns=feature_cols)
    normal_df["Time"] = rng.integers(0, 172800, n_normal)
    normal_df["Amount"] = np.clip(rng.normal(88, 250, n_normal), 0.01, None)
    normal_df["Class"] = 0

    # Fraud transactions: shift means of key features
    fraud_shifts = {
        1: -1.5, 3: -1.2, 4: 1.3, 5: -0.8, 6: -0.5, 7: 1.0,
        9: -1.1, 10: -1.4, 11: 1.5, 12: -1.8, 14: -2.0,
        16: -1.3, 17: -1.6, 18: -0.7, 19: 0.6,
    }
    fraud_stds = {14: 0.5, 12: 0.6, 10: 0.7, 17: 0.5, 4: 0.8, 11: 0.7}

    fraud_data = rng.standard_normal((n_fraud, 28))
    for col_idx, shift in fraud_shifts.items():
        fraud_data[:, col_idx - 1] += shift
    for col_idx, std_mult in fraud_stds.items():
        fraud_data[:, col_idx - 1] *= std_mult

    fraud_df = pd.DataFrame(fraud_data, columns=feature_cols)
    fraud_df["Time"] = rng.integers(0, 172800, n_fraud)
    # Fraud tends to have unusual amounts
    large_amounts = rng.choice([True, False], n_fraud)
    amounts = np.where(
        large_amounts,
        np.clip(rng.normal(500, 600, n_fraud), 1, None),
        np.clip(rng.normal(10, 5, n_fraud), 0.01, None),
    )
    fraud_df["Amount"] = amounts
    fraud_df["Class"] = 1

    df = pd.concat([normal_df, fraud_df], ignore_index=True)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)

    # Reorder columns: Time, V1-V28, Amount, Class
    cols = ["Time"] + feature_cols + ["Amount", "Class"]
    df = df[cols]

    return df


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic credit card fraud dataset")
    parser.add_argument("--rows", type=int, default=5000, help="Total number of rows")
    parser.add_argument("--fraud-rate", type=float, default=0.05, help="Fraction of fraud transactions")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--output", type=str, default="creditcard.csv", help="Output CSV filename")
    args = parser.parse_args()

    df = generate_dataset(args.rows, args.fraud_rate, args.seed)
    df.to_csv(args.output, index=False)

    print(f"Dataset generated: {args.output}")
    print(f"  Total rows: {len(df)}")
    print(f"  Fraud cases: {df['Class'].sum()} ({df['Class'].mean()*100:.2f}%)")
    print(f"  Normal cases: {(df['Class']==0).sum()}")
    print(f"  Columns: {list(df.columns)}")


if __name__ == "__main__":
    main()
