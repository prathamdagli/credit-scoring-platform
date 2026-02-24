import pandas as pd
import numpy as np
from datetime import datetime

def map_columns(available_cols, assume_default=False):
    """Fuzzy maps common banking headers to our standard schema."""
    mapping = {
        'date': ['date', 'txn date', 'transaction date', 'value date', 'date of txn'],
        'description': ['description', 'narration', 'particulars', 'remarks', 'trans details'],
        'amount': ['amount', 'txn amt', 'transaction amount', 'value', 'withdrawal', 'deposit'],
        'type': ['type', 'cr/dr', 'd/c', 'debit/credit', 'txn type'],
        'category': ['category', 'txn category', 'spending type', 'head']
    }
    
    final_map = {}
    standard_cols = ['date', 'description', 'amount', 'type', 'category']
    available_lower = [str(c).lower() for c in available_cols]
    
    for std in standard_cols:
        for possible in mapping[std]:
            if possible in available_lower:
                idx = available_lower.index(possible)
                final_map[std] = available_cols[idx]
                break
    
    # If mapping failed and we are told to assume default (for header-less files)
    if not final_map and assume_default and len(available_cols) == 5:
        for i, std in enumerate(standard_cols):
            final_map[std] = available_cols[i]
            
    return final_map

def is_feature_dataframe(df: pd.DataFrame):
    """Detects if the dataframe contains processed features instead of raw transactions."""
    feature_signature = ['income_regularity', 'avg_monthly_income', 'savings_rate']
    return all(col in df.columns for col in feature_signature)

def process_feature_dataframe(df: pd.DataFrame):
    """Converts a feature-laden dataframe into the format expected by the predict service."""
    from .inference import ML_FEATURE_NAMES
    
    # Extract the first row as the representative vector
    row = df.iloc[0].to_dict()
    
    features = []
    for name in ML_FEATURE_NAMES:
        features.append(float(row.get(name, 0.0)))
    
    # Fill the remaining 6 post-processing signals
    remaining = ['investment_regularity', 'ott_regularity', 'investment_count', 'luxury_ratio', 'stability_index', 'ott_count']
    for name in remaining:
        features.append(float(row.get(name, 0.0)))
        
    # Reconstruct synthetic categorical analysis for UI consistency
    avg_spend = float(row.get('avg_monthly_spend', 0.0))
    disc_ratio = float(row.get('discretionary_spending_ratio', 0.0))
    
    categorical_analysis = [
        {
            "category": "Fixed Commitments",
            "amount": round(avg_spend * (1 - disc_ratio), 2),
            "percentage": (1 - disc_ratio) * 100
        },
        {
            "category": "Discretionary & Others",
            "amount": round(avg_spend * disc_ratio, 2),
            "percentage": disc_ratio * 100
        }
    ]
        
    return features, categorical_analysis

def extract_features(df: pd.DataFrame):
    """
    Converts raw transaction dataframe into 15 behavioral features.
    Now includes detection for SIPs, FDs, and OTT subscriptions.
    """
    # Standardize columns
    col_map = map_columns(df.columns, assume_default=True)
    if len(col_map) < 5:
        missing = [c for c in ['date', 'description', 'amount', 'type', 'category'] if c not in col_map]
        raise ValueError(f"Missing required columns: {missing}")
    
    # Rename and normalize
    df = df.rename(columns={v: k for k, v in col_map.items()})
    df['date'] = pd.to_datetime(df['date'])
    df['month_year'] = df['date'].dt.to_period('M')
    df['description'] = df['description'].astype(str).str.upper()
    df['category'] = df['category'].astype(str).str.upper()
    df['type'] = df['type'].astype(str).str.upper()
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce').abs()
    
    # Monthly aggregations
    monthly_income = df[df['category'] == 'SALARY'].groupby('month_year')['amount'].sum()
    monthly_spend = df[df['type'] == 'DEBIT'].groupby('month_year')['amount'].sum()
    
    all_months = df['month_year'].unique()
    num_months = len(all_months)
    
    # 1. income_regularity
    income_regularity = len(monthly_income) / num_months if num_months > 0 else 0
    
    # 2. avg_monthly_income
    avg_monthly_income = monthly_income.mean() if not monthly_income.empty else 0
    
    # 3. Investment & Wealth Detection (Beyond just SIP)
    wealth_keywords = ['SIP', 'MUTUAL FUND', 'NIPPON', 'HDFC MF', 'INVEST', 'FD ', 'RD ', 'LIQUID FUND', 'INSURANCE', 'LIC ']
    wealth_txns = df[df['description'].str.contains('|'.join(wealth_keywords), na=False)]
    investment_count = len(wealth_txns)
    investment_regularity = len(wealth_txns['month_year'].unique()) / num_months if num_months > 0 else 0
    
    # 4. Lifestyle & Discretionary Trends
    luxury_keywords = ['APPLE', 'IPHONE', 'ZARA', 'GUCCI', 'STARBUCKS', 'DINING', 'CLUB', 'BAR ', 'RESORT']
    luxury_txns = df[df['description'].str.contains('|'.join(luxury_keywords), na=False)]
    luxury_ratio = luxury_txns['amount'].sum() / (monthly_spend.sum() + 1e-6)
    
    # 5. Stability & Liquidity
    # Estimate min balance per month (simplified proxy: total income - total spend)
    monthly_net = monthly_income - monthly_spend
    stability_index = monthly_net.mean() / (monthly_spend.mean() + 1e-6) if not monthly_spend.empty else 0
    
    # 6. OTT Detection (Subscriptions)
    ott_keywords = ['NETFLIX', 'SPOTIFY', 'PRIME VIDEO', 'DISNEY', 'HOTSTAR', 'YOUTUBE PREM', 'SONY LIV']
    ott_txns = df[df['description'].str.contains('|'.join(ott_keywords), na=False)]
    ott_regularity = len(ott_txns['month_year'].unique()) / num_months if num_months > 0 else 0
    
    # 5. Income Growth Trend
    if len(monthly_income) > 1:
        y_inc = monthly_income.values
        x_inc = np.arange(len(y_inc))
        income_growth_trend = np.polyfit(x_inc, y_inc, 1)[0] / (avg_monthly_income + 1e-6)
    else:
        income_growth_trend = 0
        
    # 6. Average Monthly Spend
    avg_monthly_spend = monthly_spend.mean() if not monthly_spend.empty else 0
    
    # 7. Discretionary Spending Ratio
    commits_list = ['RENT', 'EMI', 'UTILITIES']
    commits = df[df['category'].isin(commits_list)]['amount'].sum()
    total_spend_val = monthly_spend.sum()
    discretionary_spend = total_spend_val - commits
    discretionary_spending_ratio = discretionary_spend / (total_spend_val + 1e-6)
    
    # 8. Savings Rate
    total_income = monthly_income.sum()
    savings_rate = (total_income - total_spend_val) / (total_income + 1e-6)
    
    # 9. Rent & EMI Ratios
    total_rent = df[df['category'] == 'RENT']['amount'].sum()
    rent_ratio = (total_rent / num_months) / (avg_monthly_income + 1e-6) if num_months > 0 else 0
    
    total_emi = df[df['category'] == 'EMI']['amount'].sum()
    emi_ratio = (total_emi / num_months) / (avg_monthly_income + 1e-6) if num_months > 0 else 0
    
    # 10. Commitment Fulfillment
    expected_commits = 0
    actual_commits = 0
    if total_rent > 0:
        expected_commits += num_months
        actual_commits += len(df[df['category'] == 'RENT']['month_year'].unique())
    if total_emi > 0:
        expected_commits += num_months
        actual_commits += len(df[df['category'] == 'EMI']['month_year'].unique())
    if investment_count > 0:
        expected_commits += num_months
        actual_commits += len(wealth_txns['month_year'].unique())
        
    commitment_fulfillment_rate = actual_commits / (expected_commits + 1e-6) if expected_commits > 0 else 1.0
    
    # 11. Volatility & Stability
    spending_volatility = monthly_spend.std() / (avg_monthly_spend + 1e-6) if len(monthly_spend) > 1 else 0
    net_cashflow_stability = (income_regularity + commitment_fulfillment_rate + investment_regularity) / (1 + spending_volatility)
    
    # 12. Final Features List (18 features)
    features = [
        income_regularity,
        avg_monthly_income,
        income_growth_trend,
        avg_monthly_spend,
        discretionary_spending_ratio,
        savings_rate,
        rent_ratio,
        emi_ratio,
        commitment_fulfillment_rate,
        float(expected_commits - actual_commits), # missed_commitments_count
        spending_volatility,
        net_cashflow_stability,
        investment_regularity,
        ott_regularity,
        float(investment_count),
        luxury_ratio,
        stability_index,
        float(len(ott_txns))
    ]
    
    # Categorical Analysis
    category_spend = df[df['type'] == 'DEBIT'].groupby('category')['amount'].sum().abs().to_dict()
    total_debit = sum(category_spend.values())
    
    categorical_analysis = []
    for cat, amt in category_spend.items():
        categorical_analysis.append({
            "category": cat.title(),
            "amount": float(amt),
            "percentage": float((amt / total_debit * 100)) if total_debit > 0 else 0
        })
    
    categorical_analysis = sorted(categorical_analysis, key=lambda x: x['amount'], reverse=True)

    return features, categorical_analysis
