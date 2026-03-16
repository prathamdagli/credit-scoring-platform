class InsightsEngine:
    def generate_insights(self, features: dict) -> list:
        insights = []
        
        # 1. Savings Insight
        sr = features.get('savings_rate', 0)
        if sr < 0.15:
            target = "20%"
            insights.append({
                "feature": "Savings Rate",
                "impact": f"Your savings rate is currently {int(sr*100)}%. Increasing it to {target} could improve your credit score.",
                "positive": False
            })
        elif sr > 0.3:
            insights.append({
                "feature": "Savings Rate",
                "impact": "Excellent savings rate! Your strong cash reserves contribute heavily to your positive stability score.",
                "positive": True
            })
            
        # 2. EMI Burden Insight
        dti = features.get('debt_to_income_ratio', 0)
        if dti > 0.35:
            insights.append({
                "feature": "EMI Burden",
                "impact": f"Your EMI payments consume {int(dti*100)}% of income. Reducing this below 35% improves future loan eligibility.",
                "positive": False
            })
            
        # 3. Income Consistency Insight
        ic = features.get('income_consistency', 0)
        if ic > 0.8:
            insights.append({
                "feature": "Income Stability",
                "impact": "Consistent monthly income detected. This significantly improves your financial stability score.",
                "positive": True
            })
        elif ic < 0.4:
            insights.append({
                "feature": "Income Stability",
                "impact": "High income variability detected. Smoothing out irregular inflows could stabilize your scoring trajectory.",
                "positive": False
            })
            
        # 4. Expenditure / Discretionary insight
        sd = features.get('spending_discipline', 0)
        if sd < 0.4:
            insights.append({
                "feature": "Spending Discipline",
                "impact": "High ratio of discretionary spending seen. Redirecting some towards investments can boost your wealth building components.",
                "positive": False
            })
            
        # 5. Investments Insight
        inv_active = features.get('investment_activity_present', 0)
        if inv_active == 0:
            insights.append({
                "feature": "Wealth Creation",
                "impact": "Starting automated investments (like SIPs) will add a positive wealth-creation multiplier to your behavioral score.",
                "positive": False
            })
            
        return insights[:4] # Keep top 4 most relevant insights

    def estimate_loan_eligibility(self, features: dict, score: int) -> list:
        eligibility = []
        dti = features.get('debt_to_income_ratio', 0)
        income = features.get('avg_monthly_income', 0)
        
        # Basic sanity check
        if income < 5000:
             return [
                 {"type": "Home Loan", "status": "Not Eligible", "estimate": "Insufficient income baseline"},
                 {"type": "Car Loan", "status": "Not Eligible", "estimate": "Insufficient income baseline"},
                 {"type": "Personal Loan", "status": "Not Eligible", "estimate": "Insufficient income baseline"}
             ]
             
        # Rule of thumb estimates
        # Home Loan: usually max 50% DTI total, so available headroom is (0.5 - current DTI) * income
        max_emi_headroom = max(0, (0.5 - dti)) * income
        
        # Home loan: 1 Lakh EMI ~ 1 Crore Loan (roughly per 15 yrs) 
        # i.e., Max Loan = headroom * 100
        home_max = max(0, max_emi_headroom * 100)
        
        # Car loan: shorter term, 10k EMI ~ 5 Lakh loan (roughly per 5 yrs) -> headroom * 50
        car_max = max(0, max_emi_headroom * 50)
        
        # Personal loan likelihood (based on score primarily)
        if score > 750: pl_likelihood = "High Approval Likelihood"
        elif score > 650: pl_likelihood = "Moderate Likelihood"
        else: pl_likelihood = "Low Likelihood"
        
        # Format outputs cleanly
        def format_currency(val):
            if val > 10000000: return f"₹{val/10000000:.2f} Cr"
            elif val > 100000: return f"₹{val/100000:.2f} L"
            else: return f"₹{int(val)}"
            
        eligibility.append({
            "type": "Home Loan",
            "status": "Eligible" if home_max > 500000 else "Not Eligible",
            "estimate": f"Up to {format_currency(home_max)}" if home_max > 500000 else "High DTI Burden"
        })
        eligibility.append({
            "type": "Car Loan",
            "status": "Eligible" if car_max > 100000 else "Not Eligible",
            "estimate": f"Up to {format_currency(car_max)}" if car_max > 100000 else "High DTI Burden"
        })
        eligibility.append({
            "type": "Personal Loan",
            "status": "Check Quotes" if score > 600 else "Wait & Improve",
            "estimate": pl_likelihood
        })
        
        return eligibility

insights_engine = InsightsEngine()
