import pandas as pd
import numpy as np

def is_feature_dataframe(df: pd.DataFrame):
    return 'income_regularity' in df.columns

def process_feature_dataframe(df: pd.DataFrame):
    # Backward compat stub if needed
    row = df.iloc[0].to_dict()
    features = [float(row.get(k, 0)) for k in ML_FEATURE_NAMES]
    return features, []

def extract_features(df: pd.DataFrame):
    """
    Computes advanced meaningful behavioral indicators from standard transaction data.
    Input df columns expected: date, description, amount, type, category
    """
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df['month_year'] = df['date'].dt.to_period('M')
    
    # 1. Monthly Aggregations
    monthly_income = df[(df['type'] == 'CREDIT') & (df['category'].isin(['Salary', 'Other Income']))].groupby('month_year')['amount'].sum()
    monthly_spend = df[df['type'] == 'DEBIT'].groupby('month_year')['amount'].sum()
    
    all_months = df['month_year'].unique()
    num_months = len(all_months) if len(all_months) > 0 else 1
    
    # Average Income and Expense
    avg_monthly_income = monthly_income.mean() if not monthly_income.empty else 0
    avg_monthly_spend = monthly_spend.mean() if not monthly_spend.empty else 0
    
    # Savings & Stability
    monthly_net = monthly_income - monthly_spend
    avg_monthly_savings = monthly_net.mean() if not monthly_net.empty else 0
    savings_rate = avg_monthly_savings / (avg_monthly_income + 1e-6) if avg_monthly_income > 0 else 0
    
    income_consistency = 1 - (monthly_income.std() / (avg_monthly_income + 1e-6) if len(monthly_income) > 1 else 0)
    income_consistency = max(0, min(1, income_consistency)) # bounded 0-1
    
    spending_variability = monthly_spend.std() / (avg_monthly_spend + 1e-6) if len(monthly_spend) > 1 else 0
    balance_stability = monthly_net.mean() / (monthly_spend.mean() + 1e-6) if not monthly_spend.empty else 0
    
    # Debt & Commits
    total_emi = df[df['category'] == 'EMI']['amount'].sum()
    avg_monthly_emi = total_emi / num_months
    debt_to_income_ratio = avg_monthly_emi / (avg_monthly_income + 1e-6)
    recurring_emi_presence = 1.0 if not df[df['category'] == 'EMI'].empty else 0.0
    
    total_rent = df[df['category'] == 'Rent']['amount'].sum()
    avg_monthly_rent = total_rent / num_months
    fixed_commits = avg_monthly_emi + avg_monthly_rent
    
    # Wealth & Discipline
    investment_txns = df[df['category'] == 'Investment']
    insurance_txns = df[df['category'] == 'Insurance']
    investment_activity_present = 1.0 if not investment_txns.empty else 0.0
    insurance_presence = 1.0 if not insurance_txns.empty else 0.0
    
    # Spending Discipline (Discretionary vs Fixed)
    discretionary_spend = avg_monthly_spend - fixed_commits
    discretionary_ratio = discretionary_spend / (avg_monthly_spend + 1e-6)
    spending_discipline = 1.0 - discretionary_ratio # Higher means less discretionary waste
    
    # Compile exactly 14 features for the new Inference logic
    features = {
        "avg_monthly_income": float(avg_monthly_income),
        "avg_monthly_spend": float(avg_monthly_spend),
        "avg_monthly_savings": float(avg_monthly_savings),
        "savings_rate": float(savings_rate),
        "income_consistency": float(income_consistency),
        "spending_variability": float(spending_variability),
        "balance_stability": float(balance_stability),
        "debt_to_income_ratio": float(debt_to_income_ratio),
        "recurring_emi_presence": float(recurring_emi_presence),
        "investment_activity_present": float(investment_activity_present),
        "insurance_presence": float(insurance_presence),
        "spending_discipline": float(spending_discipline),
        "fixed_commitments_ratio": float(fixed_commits / (avg_monthly_income + 1e-6)),
        "luxury_ratio": float(df[df['category'].isin(['Entertainment', 'Shopping'])]['amount'].sum() / num_months / (avg_monthly_spend + 1e-6))
    }
    
    # Categorical Analysis Generation
    category_spend = df[df['type'] == 'DEBIT'].groupby('category')['amount'].sum().to_dict()
    total_debit = sum(category_spend.values())
    
    analytics = []
    for cat, amt in category_spend.items():
        analytics.append({
            "category": cat.title(),
            "amount": float(amt),
            "percentage": float((amt / total_debit * 100)) if total_debit > 0 else 0
        })
    analytics = sorted(analytics, key=lambda x: x['amount'], reverse=True)
    
    return features, analytics
