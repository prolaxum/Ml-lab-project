from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
from collections import Counter

# --- Database Setup (Persistent Layer) ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./network_logs.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TrafficLog(Base):
    __tablename__ = "traffic_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    duration = Column(Float)
    src_bytes = Column(Float)
    dst_bytes = Column(Float)
    count = Column(Float)
    status = Column(String)  # This now stores the raw class (e.g., 'normal', 'neptune')

# Create the tables if they don't exist
Base.metadata.create_all(bind=engine)

# --- FastAPI & AI Brain Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model and scaler
model = joblib.load('../../ml_pipeline/scripts/anomaly_model.pkl')
scaler = joblib.load('../../ml_pipeline/scripts/scaler.pkl')

class NetworkPacket(BaseModel):
    duration: float
    src_bytes: float
    dst_bytes: float
    count: float

# --- ADVANCED MULTI-CLASS ENDPOINTS ---

@app.post("/api/predict")
def predict_anomaly(packet: NetworkPacket):
    # 1. Analyze the input
    input_data = np.array([[packet.duration, packet.src_bytes, packet.dst_bytes, packet.count]])
    scaled_data = scaler.transform(input_data)
    prediction = model.predict(scaled_data)
    
    # 2. Get the specific multi-class label (e.g., 'neptune', 'satan', 'normal')
    raw_status = str(prediction[0])
    
    # 3. Save to the Database
    db = SessionLocal()
    db_log = TrafficLog(
        duration=packet.duration,
        src_bytes=packet.src_bytes,
        dst_bytes=packet.dst_bytes,
        count=packet.count,
        status=raw_status
    )
    db.add(db_log)
    db.commit()
    db.close()
    
    return {"status": raw_status, "packet_data": packet.model_dump()}

@app.get("/api/analytics")
def get_analytics_data():
    db = SessionLocal()
    # 1. Get the 50 most recent logs for scatter and charts
    logs = db.query(TrafficLog).order_by(TrafficLog.id.desc()).limit(50).all()
    db.close()

    # 2. Format basic timeline and table data
    timeline_logs = []
    statuses = []
    
    for log in reversed(logs):
        statuses.append(log.status)
        timeline_logs.append({
            "id": log.id,
            "time": log.timestamp.strftime("%H:%M:%S"),
            "src_bytes": log.src_bytes,
            "count": log.count,
            "class": log.status,
            # We assign numbers just for the timeline view (0=Safe, 1=Attack)
            "threat_level": 0 if log.status == 'normal' else 1 
        })

    # 3. Calculate PIE CHART Data (Multi-Class Distribution)
    class_counts = Counter(statuses)
    
    # Map raw NSL-KDD classes to user-friendly categories for the Viva
    category_map = {
        'normal': 'Safe Traffic',
        'neptune': 'DoS (Flooding)',
        'back': 'DoS (Backdoor)',
        'satan': 'Probe (Scanning)',
        'ipsweep': 'Probe (IP Sweep)',
        'portsweep': 'Probe (Port Scan)',
        'warezclient': 'R2L (Unauthorized Access)',
        'teardrop': 'DoS (Fragmented)',
        'pod': 'DoS (Ping of Death)',
        'nmap': 'Probe (Scanning)'
    }
    
    # Initialize counts for user-friendly categories
    safe_count = class_counts.get('normal', 0)
    dos_count = sum(class_counts.get(cls, 0) for cls in ['neptune', 'back', 'teardrop', 'pod'])
    probe_count = sum(class_counts.get(cls, 0) for cls in ['satan', 'ipsweep', 'portsweep', 'nmap'])
    r2l_count = sum(class_counts.get(cls, 0) for cls in ['warezclient'])

    pie_data = [
        {"name": "Safe Traffic", "value": safe_count, "fill": "#10b981"}, # Emerald
        {"name": "DoS Attack", "value": dos_count, "fill": "#ef4444"},   # Red
        {"name": "Network Probe", "value": probe_count, "fill": "#f59e0b"}, # Amber
        {"name": "Unauthorized Access", "value": r2l_count, "fill": "#3b82f6"} # Blue
    ]
    
    # Remove categories with 0 counts for a cleaner Pie Chart
    pie_data = [d for d in pie_data if d["value"] > 0]

    return {
        "timeline_logs": timeline_logs,
        "pie_data": pie_data,
        "confusion_heatmap": {
            # Static example data for the confusion matrix Viva demo
            "data": [
                {"name": "Predicted Safe", "actual_safe": 25, "actual_attack": 1, "total": 26},
                {"name": "Predicted Attack", "actual_safe": 2, "actual_attack": 22, "total": 24}
            ]
        }
    }