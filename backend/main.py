from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import os
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, auth, firestore
import json
from services.feature_engine import extract_features
from services.inference import inference_service
from services.certificate import generate_certificate_pdf
from services.parser_service import parser_service
from services.categorizer import categorizer_service
from services.insights_engine import insights_engine
from fastapi.responses import Response

app = FastAPI(title="Crediscout API")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase
if not firebase_admin._apps:
    firebase_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
    if not firebase_json:
        raise Exception("FIREBASE_CREDENTIALS_JSON not set")
    cred_dict = json.loads(firebase_json)
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def to_native(obj):
    """Recursively convert NumPy/Pandas types to native Python types."""
    if isinstance(obj, dict):
        return {k: to_native(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_native(i) for i in obj]
    elif hasattr(obj, "item"): # Caught for NumPy scalars like np.float32/64
        return obj.item()
    elif isinstance(obj, (datetime, str, int, float, bool)) or obj is None:
        return obj
    else:
        # Fallback for anything else that might have a __dict__ or just return as is
        try:
            return float(obj) if "float" in str(type(obj)) else int(obj) if "int" in str(type(obj)) else obj
        except:
            return obj

async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

@app.post("/api/upload")
async def upload_transactions(
    file: UploadFile = File(...), 
    user: dict = Depends(verify_token)
):
    if not file.filename.endswith(('.csv', '.pdf', '.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV, PDF, or XLSX files are supported")
    
    try:
        content = await file.read()
        
        # 1. Parse & Normalize Format
        raw_df = parser_service.parse_file(content, file.filename)
        
        # 2. Categorize
        df = categorizer_service.categorize_dataframe(raw_df)
        
        from services.feature_engine import is_feature_dataframe, process_feature_dataframe
        
        # Check if it's already a feature-engineered dataframe (e.g., test_1.csv) - mostly obsolete now
        if is_feature_dataframe(df):
            features, analytics = process_feature_dataframe(df)
        else:
            # Standard Transaction Data Path
            # No need for map_columns here since parser_service normalizes it to: date, description, amount, type

            # 2. Extract features & analytics
            features, analytics = extract_features(df)
        
        # 3. Fetch previous score for smoothing (Sort in memory to avoid mandatory composite indexing)
        all_prev = db.collection("credibility_scores").where("uid", "==", user["uid"]).stream()
        prev_docs = []
        for d in all_prev:
            prev_docs.append(d.to_dict())
            
        prev_score = None
        if prev_docs:
            prev_docs.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
            prev_score = prev_docs[0].get("score")

        # 4. Model Inference & Insights
        result = inference_service.predict(features, prev_score)
        financial_insights = insights_engine.generate_insights(features)
        loan_eligibility = insights_engine.estimate_loan_eligibility(features, result["score"])
        
        # 5. Compile Advanced Payload
        score_data = {
            "uid": user["uid"],
            "credit_score": result["score"],
            "score": result["score"], # backward compat
            "risk_level": result["risk_level"],
            "tier": result["tier"],
            "score_components": result["score_components"],
            "financial_insights": financial_insights,
            "loan_eligibility": loan_eligibility,
            "features": features,
            "spending_breakdown": analytics,
            "analytics": analytics, # backward compat
            "filename": file.filename,
            "created_at": datetime.utcnow()
        }
        
        # 6. Save to Firestore
        score_ref = db.collection("credibility_scores").document()
        # Sanitize data for Firestore (nuclear fix for NumPy types)
        score_ref.set(to_native(score_data))
        
        return {
            "id": score_ref.id,
            **to_native(score_data)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard")
async def get_dashboard(user: dict = Depends(verify_token)):
    try:
        # Get all scores for user and sort in memory to avoid indexing issues
        docs = db.collection("credibility_scores") \
            .where("uid", "==", user["uid"]) \
            .stream()
        
        scores = []
        for doc in docs:
            d = doc.to_dict()
            d["id"] = doc.id
            scores.append(d)
        
        if not scores:
            return {"message": "No scores found", "data": None}
            
        # Sort by created_at descending
        scores.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        latest_score = scores[0]
        
        # Ensure created_at is serialized if it's a datetime/timestamp
        if hasattr(latest_score.get("created_at"), "isoformat"):
            latest_score["created_at_iso"] = latest_score["created_at"].isoformat()
            
        return latest_score
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/certificate/{score_id}")
async def get_certificate(score_id: str, user: dict = Depends(verify_token)):
    try:
        doc_ref = db.collection("credibility_scores").document(score_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Score not found")
        
        data = doc.to_dict()
        if data["uid"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        pdf_bytes = generate_certificate_pdf(
            user_name=user.get("name", "User"),
            score=data["score"],
            tier=data["tier"],
            insights=data["insights"]
        )
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=crediscout_certificate_{score_id}.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scores")
async def get_all_scores(user: dict = Depends(verify_token)):
    try:
        docs = db.collection("credibility_scores") \
            .where("uid", "==", user["uid"]) \
            .stream()
        
        scores = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            if "created_at" in data and hasattr(data["created_at"], "isoformat"):
                data["created_at"] = data["created_at"].isoformat()
            scores.append(data)
            
        # Sort by created_at ascending for trend line
        scores.sort(key=lambda x: x.get("created_at", ""), reverse=False)
        return scores
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

class SimulationRequest(BaseModel):
    score_id: str
    scenario: str # "increase_savings", "decrease_emi", "increase_income"
    magnitude: float # decimal percentage string e.g. 0.10 for 10%

@app.post("/api/simulate")
async def simulate_scenario(req: SimulationRequest, user: dict = Depends(verify_token)):
    try:
        # Load the base score data
        doc_ref = db.collection("credibility_scores").document(req.score_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Score not found")
            
        data = doc.to_dict()
        if data["uid"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
            
        original_features = data["features"]
        simulated_features = dict(original_features) # deep copy
        
        # Apply tweak based on scenario
        if req.scenario == "increase_savings":
            simulated_features['savings_rate'] = min(1.0, simulated_features['savings_rate'] * (1 + req.magnitude))
            simulated_features['avg_monthly_savings'] = simulated_features['avg_monthly_savings'] * (1 + req.magnitude)
        elif req.scenario == "decrease_emi":
            simulated_features['debt_to_income_ratio'] = max(0.0, simulated_features['debt_to_income_ratio'] * (1 - req.magnitude))
            simulated_features['fixed_commitments_ratio'] = max(0.0, simulated_features['fixed_commitments_ratio'] * (1 - req.magnitude))
        elif req.scenario == "increase_income":
            simulated_features['avg_monthly_income'] = simulated_features['avg_monthly_income'] * (1 + req.magnitude)
            
        # Re-run inference without smoothing so they see direct impact
        sim_result = inference_service.predict(simulated_features, previous_score=None)
        
        difference = sim_result["score"] - data["score"]
        if difference > 0:
            message = f"If you {req.scenario.replace('_', ' ')} by {int(req.magnitude*100)}%, your score could increase by {difference} points to {sim_result['score']}."
        elif difference < 0:
            message = f"If you {req.scenario.replace('_', ' ')} by {int(req.magnitude*100)}%, your score could decrease by {abs(difference)} points to {sim_result['score']}."
        else:
            message = f"This change would have minimal direct impact on your core credit profile."
        
        return {
            "scenario": req.scenario,
            "simulated_score": sim_result["score"],
            "difference": difference,
            "message": message
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
