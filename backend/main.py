from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import os
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, auth, firestore
from .services.feature_engine import extract_features
from .services.inference import inference_service
from .services.certificate import generate_certificate_pdf
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
cred_path = os.path.join(os.path.dirname(__file__), "..", "firebase-service-account.json")
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

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
    if not file.filename.endswith(('.csv', '.pdf')):
        raise HTTPException(status_code=400, detail="Only CSV or PDF files are supported")
    
    try:
        content = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            # Basic PDF Extraction
            from pypdf import PdfReader
            pdf = PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf.pages:
                text += page.extract_text() + "\n"
            
            # Simple heuristic for transactions: Look for lines with dates and amounts
            # Format: Date, Description, Amount, Type, Category
            lines = text.split('\n')
            data = []
            for line in lines:
                parts = line.split()
                # Very simple fuzzy logic: if line has enough parts and looks like it has a date
                if len(parts) >= 4:
                    data.append({
                        "date": parts[0],
                        "description": " ".join(parts[1:-3]),
                        "amount": float(parts[-3].replace(',', '')),
                        "type": parts[-2].upper(),
                        "category": parts[-1].upper()
                    })
            
            if not data:
                # Fallback for hackathon: if parsing fails, use synthetic data but mark as success 
                # (to avoid user frustration) or raise error. Let's raise error for now.
                raise Exception("Could not parse transactions from PDF. Ensure PDF is text-based.")
            
            df = pd.DataFrame(data)
            
        from .services.feature_engine import map_columns, is_feature_dataframe, process_feature_dataframe
        
        # Check if it's already a feature-engineered dataframe (e.g., test_1.csv)
        if is_feature_dataframe(df):
            features, analytics = process_feature_dataframe(df)
        else:
            # Standard Transaction Data Path
            col_map = map_columns(df.columns, assume_default=True)
            if len(col_map) < 5:
                missing = [c for c in ['date', 'description', 'amount', 'type', 'category'] if c not in col_map]
                raise HTTPException(status_code=400, detail=f"Missing or unrecognized columns: {missing}. Found: {list(df.columns)}")

            # 2. Extract features & analytics
            features, analytics = extract_features(df)
        
        # 3. Model Inference
        result = inference_service.predict(features)
        
        # 4. Save to Firestore
        score_ref = db.collection("credibility_scores").document()
        score_data = {
            "uid": user["uid"], # Using 'user' from Depends(verify_token)
            "score": result["score"],
            "tier": result["tier"],
            "probabilities": result["probabilities"],
            "insights": result["insights"],
            "features": features,
            "analytics": analytics,
            "filename": file.filename,
            "created_at": datetime.utcnow()
        }
        score_ref.set(score_data)
        
        return {
            "id": score_ref.id,
            **result
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

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
