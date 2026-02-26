import joblib
import pandas as pd
import shap
import os
import numpy as np

# Feature names in order used during training
# Feature names used during training (Strict 12)
ML_FEATURE_NAMES = [
    "income_regularity", "avg_monthly_income", "income_growth_trend",
    "avg_monthly_spend", "discretionary_spending_ratio", "savings_rate",
    "rent_ratio", "emi_ratio", "commitment_fulfillment_rate",
    "missed_commitments_count", "spending_volatility", "net_cashflow_stability"
]

# Total signals analyzed (18)
ALL_SIGNAL_NAMES = ML_FEATURE_NAMES + [
    "investment_regularity", "ott_regularity", "investment_count",
    "luxury_ratio", "stability_index", "ott_count"
]

class InferenceService:
    def __init__(self, model_path: str):
        self.model = joblib.load(model_path)
        self._explainer = None
    
    @property
    def explainer(self):
        if self._explainer is None:
            try:
                # Explain using the 12 ML features
                self._explainer = shap.TreeExplainer(self.model)
            except Exception as e:
                try:
                    dummy_data = pd.DataFrame([[0.5] * len(ML_FEATURE_NAMES)], columns=ML_FEATURE_NAMES)
                    self._explainer = shap.TreeExplainer(self.model, dummy_data)
                except:
                    self._explainer = "DISABLED"
        return self._explainer
    
    def predict(self, features: list):
        # features list is 18 elements from feature_engine
        if len(features) < len(ALL_SIGNAL_NAMES):
            features = features + [0.0] * (len(ALL_SIGNAL_NAMES) - len(features))
            
        # Separate ML features (index 0-11) for the model
        ml_features = features[:12]
        X_ml = pd.DataFrame([ml_features], columns=ML_FEATURE_NAMES)
        
        # Base ML Prediction
        probs = self.model.predict_proba(X_ml)[0]
        base_score = (probs[2] * 1.0 + probs[1] * 0.5) * 100
        
        # --- Multi-Dimensional Post-Processing ---
        # Using full 18 signals
        missed_commits = features[9]
        wealth_reg = features[12]
        wealth_count = features[14]
        luxury_ratio = features[15]
        stability_idx = features[16]
        ott_reg = features[13]
        
        penalty = 0
        bonus = 0
        
        # 1. Wealth & Consistency (Beyond SIP)
        if wealth_count > 0:
            if wealth_reg < 0.8:
                penalty += (1.0 - wealth_reg) * 35 # Heavy penalty for broken investment patterns
            else:
                bonus += 12 # Reward for wealth creation discipline
                
        # 2. Lifestyle Bias (Luxury spending)
        if luxury_ratio > 0.3: # >30% on luxury
            penalty += (luxury_ratio - 0.3) * 50 # Exponential-like penalty for high luxury
            
        # 3. Stability & Liquidity (Emergency Fund proxy)
        if stability_idx > 0.4: # Saving 40% of spend value as net monthly
            bonus += 8
        elif stability_idx < 0: # Living beyond means
            penalty += 10
            
        # 4. Habitual Commits (OTT/Subs)
        if ott_reg > 0.8:
            bonus += 4 # Reward for "small" discipline
            
        # 5. Hard Penalties
        penalty += missed_commits * 8
        
        # --- Distribution Recalibration ---
        raw_final = (base_score * 0.8) - penalty + bonus
        
        # Apply CIBIL-like saturation (Harder to get 100)
        if raw_final > 85:
            raw_final = 85 + (raw_final - 85) * 0.25
            
        final_score = max(0, min(100, raw_final))
        
        # Tiers
        if final_score > 85: tier = "STABLE"
        elif final_score > 60: tier = "MODERATE"
        else: tier = "RISKY"
            
        # SHAP Insights (Top 5)
        explanations = []
        if self.explainer != "DISABLED":
            try:
                shap_raw = self.explainer.shap_values(X_ml)
                target_base = shap_raw[2] if isinstance(shap_raw, list) else shap_raw
                arr = np.squeeze(np.array(target_base))
                target_shap = arr.flatten()[:len(ML_FEATURE_NAMES)]
                for name, val in zip(ML_FEATURE_NAMES, target_shap):
                    impact = float(val)
                    explanations.append({
                        "feature": name.replace("_", " ").title(),
                        "impact": impact,
                        "positive": impact > 0
                    })
            except: pass
            
        explanations = sorted(explanations, key=lambda x: abs(x['impact']), reverse=True)
        
        return {
            "score": float(round(final_score, 2)),
            "tier": tier,
            "probabilities": {
                "risky": float(probs[0]),
                "moderate": float(probs[1]),
                "stable": float(probs[2])
            },
            "insights": explanations[:5],
            "signals": {
                "wealth_discipline": float(round(wealth_reg * 100, 1)),
                "lifestyle_overhead": float(round(luxury_ratio * 100, 1)),
                "stability_buffer": float(round(stability_idx * 100, 1)),
                "missed_signals": int(missed_commits)
            }
        }

# Singleton instance
model_path = os.path.join(os.path.dirname(__file__), "..", "models", "model.pkl")
inference_service = InferenceService(model_path)
