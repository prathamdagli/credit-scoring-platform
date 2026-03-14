import math

class RealisticInferenceService:
    def __init__(self):
        self.BASELINE_SCORE = 650 # Standard starting neutral score
        self.MIN_SCORE = 300
        self.MAX_SCORE = 900
        
    def predict(self, features: dict, previous_score: float = None) -> dict:
        """
        Calculates a realistic credit-like score using heuristics derived from the features.
        Never collapses to zero. Changes gradually if previous_score is provided.
        """
        bonus_points = 0
        penalty_points = 0
        components_explanation = []
        
        # Helper to add explanations
        def add_component(name, impact, description=None):
            nonlocal bonus_points, penalty_points
            if impact > 0:
                bonus_points += impact
            else:
                penalty_points += abs(impact)
            components_explanation.append({
                "name": name,
                "impact": impact,
                "description": description or name
            })

        # 1. Income Stability
        if features['income_consistency'] > 0.8:
            inc_impact = +25
            add_component("Income Stability", inc_impact, "Highly consistent income stream")
        elif features['income_consistency'] < 0.4:
            inc_impact = -15
            add_component("Income Volatility", inc_impact, "Irregular income patterns detected")
        else:
            inc_impact = +10
            add_component("Income Stability", inc_impact, "Moderate income consistency")

        # 2. Savings Behavior
        sr = features['savings_rate']
        if sr > 0.3:
            add_component("Savings Behavior", +30, "Excellent savings rate (>30%)")
        elif sr > 0.15:
            add_component("Savings Behavior", +15, "Healthy savings rate")
        elif sr < 0.05:
            add_component("Low Savings", -20, "Savings rate is critically low")
            
        # 3. Debt Burden (DTI)
        dti = features['debt_to_income_ratio']
        if features['recurring_emi_presence'] > 0:
            if dti > 0.5:
                add_component("Debt Burden", -40, "High debt burden (>50% of income)")
            elif dti > 0.35:
                add_component("Debt Burden", -15, "Moderate debt obligations")
            else:
                add_component("Debt Management", +20, "Healthy debt-to-income ratio")
        else:
            add_component("No Debt", +5, "No visible EMI obligations")

        # 4. Investment & Insurance Activity
        if features['investment_activity_present'] > 0:
            add_component("Investment Activity", +15, "Active wealth building")
        else:
            add_component("Low Investment Activity", -5, "No explicit investment transactions found")
            
        if features['insurance_presence'] > 0:
            add_component("Risk Management", +10, "Insurance payments detected")

        # 5. Spending Discipline
        sd = features['spending_discipline']
        if sd > 0.6:
            add_component("Spending Discipline", +20, "High ratio of fixed to discretionary spending")
        elif sd < 0.3:
            add_component("Excessive Discretionary Spend", -15, "High non-essential spending")

        # 6. Payment Discipline (Heuristic: no late fees, bounced checks. Here inferred from balance stability)
        if features['balance_stability'] > 0.2:
             add_component("Payment Discipline", +15, "Stable positive balance after expenses")
        elif features['balance_stability'] < 0:
             add_component("Liquidity Risk", -25, "Expenses regularly exceed income")

        # Compute Raw Target Score
        target_score = self.BASELINE_SCORE + bonus_points - penalty_points
        
        # Bound it strictly
        target_score = max(self.MIN_SCORE, min(self.MAX_SCORE, target_score))
        
        # Smoothing Logic (Exponential Moving Average)
        # Prevents dramatic fluctuations if a bad month is uploaded.
        if previous_score is not None:
            SMOOTHING_FACTOR = 0.3 # New data influences score by 30%
            final_score = (previous_score * (1 - SMOOTHING_FACTOR)) + (target_score * SMOOTHING_FACTOR)
        else:
            final_score = target_score
            
        # Risk Level Mapping
        if final_score >= 750:
            risk_level = "Excellent"
            tier = "STABLE"
        elif final_score >= 650:
            risk_level = "Good"
            tier = "MODERATE"
        elif final_score >= 550:
            risk_level = "Fair"
            tier = "MODERATE" # Keeping enum compatibility for older frontend if needed
        else:
            risk_level = "Poor"
            tier = "RISKY"
            
        # Ensure components trace to score exactly for UI rendering mathematically
        diff = final_score - self.BASELINE_SCORE
        # Normalize the components to exactly match the diff visually
        total_raw_impact = sum(c['impact'] for c in components_explanation)
        if total_raw_impact != 0:
             scale = diff / total_raw_impact if (total_raw_impact * diff > 0) else 1.0 # only scale if same sign
             for c in components_explanation:
                 c['impact'] = round(c['impact'] * scale)
        
        # Sort components by absolute impact magnitude
        components_explanation = sorted(components_explanation, key=lambda x: abs(x['impact']), reverse=True)
            
        return {
            "score": int(round(final_score)),
            "risk_level": risk_level,
            "tier": tier,
            "score_components": components_explanation,
            "baseline_used": self.BASELINE_SCORE
        }

inference_service = RealisticInferenceService()
