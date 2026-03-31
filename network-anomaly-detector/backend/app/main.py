from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime

# --- 1. Database Setup (Integrated directly here) ---
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
    status = Column(String)

# Create the database file and tables automatically
Base.metadata.create_all(bind=engine)

# --- 2. FastAPI & AI Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained AI brain
model = joblib.load('../../ml_pipeline/scripts/anomaly_model.pkl')
scaler = joblib.load('../../ml_pipeline/scripts/scaler.pkl')

class NetworkPacket(BaseModel):
    duration: float
    src_bytes: float
    dst_bytes: float
    count: float

# --- 3. API Endpoints ---

@app.post("/api/predict")
def predict_anomaly(packet: NetworkPacket):
    # Analyze the packet using the AI model
    input_data = np.array([[packet.duration, packet.src_bytes, packet.dst_bytes, packet.count]])
    scaled_data = scaler.transform(input_data)
    prediction = model.predict(scaled_data)
    
    # THE FIX: Convert NumPy string to standard Python string for SQLite compatibility
    status = str(prediction[0])
    
    # Save the result to the Database
    db = SessionLocal()
    db_log = TrafficLog(
        duration=packet.duration,
        src_bytes=packet.src_bytes,
        dst_bytes=packet.dst_bytes,
        count=packet.count,
        status=status
    )
    db.add(db_log)
    db.commit()
    db.close()
    
    return {"status": status, "packet_data": packet.model_dump()}

@app.get("/api/logs")
def get_recent_logs():
    db = SessionLocal()
    # Fetch the 20 most recent logs for the chart
    logs = db.query(TrafficLog).order_by(TrafficLog.id.desc()).limit(20).all()
    db.close()
    
    # Format data for Recharts (Frontend)
    formatted_logs = [
        {
            "id": log.id, 
            "time": log.timestamp.strftime("%H:%M:%S"), 
            "status": log.status,
            "threat_level": 0 if log.status == "Safe" else 1 
        } 
        for log in reversed(logs)
    ]
    return formatted_logs