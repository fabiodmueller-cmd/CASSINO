from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import io
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ========== MODELS ==========

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class Region(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegionCreate(BaseModel):
    name: str
    description: Optional[str] = None

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    commission_type: str  # "percentage" or "fixed"
    commission_value: float  # percentage (0-100) or fixed amount
    phone: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientCreate(BaseModel):
    name: str
    commission_type: str
    commission_value: float
    phone: Optional[str] = None
    email: Optional[str] = None

class Operator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    commission_type: str  # "percentage" or "fixed"
    commission_value: float
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OperatorCreate(BaseModel):
    name: str
    commission_type: str
    commission_value: float
    phone: Optional[str] = None

class Machine(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    multiplier: float  # 0.01, 0.10, 0.25, 0.50, 1.00
    client_id: str
    region_id: str
    operator_id: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MachineCreate(BaseModel):
    code: str
    name: str
    multiplier: float
    client_id: str
    region_id: str
    operator_id: Optional[str] = None

class Reading(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    machine_id: str
    previous_in: float
    previous_out: float
    current_in: float
    current_out: float
    gross_value: float
    client_commission: float
    operator_commission: float
    net_value: float
    reading_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReadingCreate(BaseModel):
    machine_id: str
    previous_in: float
    previous_out: float
    current_in: float
    current_out: float
    reading_date: Optional[datetime] = None


# ========== BASIC ROUTES ==========

@api_router.get("/")
async def root():
    return {"message": "SlotManager API", "status": "running"}

# ========== AUTH HELPERS ==========

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========== AUTH ROUTES ==========

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_obj = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password)
    )
    
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    token = create_access_token({"sub": user_obj.id})
    return Token(
        access_token=token,
        token_type="bearer",
        user={"id": user_obj.id, "email": user_obj.email, "name": user_obj.name}
    )

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["id"]})
    return Token(
        access_token=token,
        token_type="bearer",
        user={"id": user["id"], "email": user["email"], "name": user["name"]}
    )

# ========== REGIONS ==========

@api_router.post("/regions", response_model=Region)
async def create_region(region_data: RegionCreate, current_user: dict = Depends(get_current_user)):
    region = Region(**region_data.model_dump())
    doc = region.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.regions.insert_one(doc)
    return region

@api_router.get("/regions", response_model=List[Region])
async def get_regions(current_user: dict = Depends(get_current_user)):
    regions = await db.regions.find({}, {"_id": 0}).to_list(1000)
    for r in regions:
        if isinstance(r['created_at'], str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return regions

@api_router.put("/regions/{region_id}", response_model=Region)
async def update_region(region_id: str, region_data: RegionCreate, current_user: dict = Depends(get_current_user)):
    result = await db.regions.update_one(
        {"id": region_id},
        {"$set": region_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    updated = await db.regions.find_one({"id": region_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Region(**updated)

@api_router.delete("/regions/{region_id}")
async def delete_region(region_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.regions.delete_one({"id": region_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    return {"message": "Region deleted"}

# ========== CLIENTS ==========

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: dict = Depends(get_current_user)):
    client = Client(**client_data.model_dump())
    doc = client.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.clients.insert_one(doc)
    return client

@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: dict = Depends(get_current_user)):
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    for c in clients:
        if isinstance(c['created_at'], str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return clients

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientCreate, current_user: dict = Depends(get_current_user)):
    result = await db.clients.update_one(
        {"id": client_id},
        {"$set": client_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Client(**updated)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted"}

# ========== OPERATORS ==========

@api_router.post("/operators", response_model=Operator)
async def create_operator(operator_data: OperatorCreate, current_user: dict = Depends(get_current_user)):
    operator = Operator(**operator_data.model_dump())
    doc = operator.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.operators.insert_one(doc)
    return operator

@api_router.get("/operators", response_model=List[Operator])
async def get_operators(current_user: dict = Depends(get_current_user)):
    operators = await db.operators.find({}, {"_id": 0}).to_list(1000)
    for o in operators:
        if isinstance(o['created_at'], str):
            o['created_at'] = datetime.fromisoformat(o['created_at'])
    return operators

@api_router.put("/operators/{operator_id}", response_model=Operator)
async def update_operator(operator_id: str, operator_data: OperatorCreate, current_user: dict = Depends(get_current_user)):
    result = await db.operators.update_one(
        {"id": operator_id},
        {"$set": operator_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Operator not found")
    updated = await db.operators.find_one({"id": operator_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Operator(**updated)

@api_router.delete("/operators/{operator_id}")
async def delete_operator(operator_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.operators.delete_one({"id": operator_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Operator not found")
    return {"message": "Operator deleted"}

# ========== MACHINES ==========

@api_router.post("/machines", response_model=Machine)
async def create_machine(machine_data: MachineCreate, current_user: dict = Depends(get_current_user)):
    machine = Machine(**machine_data.model_dump())
    doc = machine.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.machines.insert_one(doc)
    return machine

@api_router.get("/machines", response_model=List[Machine])
async def get_machines(current_user: dict = Depends(get_current_user)):
    machines = await db.machines.find({}, {"_id": 0}).to_list(1000)
    for m in machines:
        if isinstance(m['created_at'], str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return machines

@api_router.put("/machines/{machine_id}", response_model=Machine)
async def update_machine(machine_id: str, machine_data: MachineCreate, current_user: dict = Depends(get_current_user)):
    result = await db.machines.update_one(
        {"id": machine_id},
        {"$set": machine_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Machine not found")
    updated = await db.machines.find_one({"id": machine_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Machine(**updated)

@api_router.delete("/machines/{machine_id}")
async def delete_machine(machine_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.machines.delete_one({"id": machine_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Machine not found")
    return {"message": "Machine deleted"}

# ========== READINGS ==========

async def calculate_reading(reading_data: ReadingCreate, machine: dict, client: dict, operator: dict = None):
    diff_in = reading_data.current_in - reading_data.previous_in
    diff_out = reading_data.current_out - reading_data.previous_out
    gross_value = (diff_in - diff_out) * machine['multiplier']
    
    # Calculate commissions
    if client['commission_type'] == 'percentage':
        client_commission = gross_value * (client['commission_value'] / 100)
    else:
        client_commission = client['commission_value']
    
    operator_commission = 0
    if operator:
        if operator['commission_type'] == 'percentage':
            operator_commission = gross_value * (operator['commission_value'] / 100)
        else:
            operator_commission = operator['commission_value']
    
    net_value = gross_value - client_commission - operator_commission
    
    return {
        'gross_value': round(gross_value, 2),
        'client_commission': round(client_commission, 2),
        'operator_commission': round(operator_commission, 2),
        'net_value': round(net_value, 2)
    }

@api_router.post("/readings", response_model=Reading)
async def create_reading(reading_data: ReadingCreate, current_user: dict = Depends(get_current_user)):
    machine = await db.machines.find_one({"id": reading_data.machine_id}, {"_id": 0})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    client = await db.clients.find_one({"id": machine['client_id']}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    operator = None
    if machine.get('operator_id'):
        operator = await db.operators.find_one({"id": machine['operator_id']}, {"_id": 0})
    
    calculations = await calculate_reading(reading_data, machine, client, operator)
    
    reading = Reading(
        machine_id=reading_data.machine_id,
        previous_in=reading_data.previous_in,
        previous_out=reading_data.previous_out,
        current_in=reading_data.current_in,
        current_out=reading_data.current_out,
        reading_date=reading_data.reading_date or datetime.now(timezone.utc),
        **calculations
    )
    
    doc = reading.model_dump()
    doc['reading_date'] = doc['reading_date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.readings.insert_one(doc)
    
    return reading

@api_router.get("/readings", response_model=List[Reading])
async def get_readings(current_user: dict = Depends(get_current_user)):
    readings = await db.readings.find({}, {"_id": 0}).sort("reading_date", -1).to_list(1000)
    for r in readings:
        if isinstance(r['reading_date'], str):
            r['reading_date'] = datetime.fromisoformat(r['reading_date'])
        if isinstance(r['created_at'], str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return readings

@api_router.post("/readings/import")
async def import_readings(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    content = await file.read()
    csv_file = io.StringIO(content.decode('utf-8'))
    csv_reader = csv.DictReader(csv_file)
    
    imported = 0
    errors = []
    
    for row in csv_reader:
        try:
            reading_data = ReadingCreate(
                machine_id=row['machine_id'],
                previous_in=float(row['previous_in']),
                previous_out=float(row['previous_out']),
                current_in=float(row['current_in']),
                current_out=float(row['current_out']),
                reading_date=datetime.fromisoformat(row['reading_date']) if row.get('reading_date') else None
            )
            
            machine = await db.machines.find_one({"id": reading_data.machine_id}, {"_id": 0})
            if not machine:
                errors.append(f"Machine {reading_data.machine_id} not found")
                continue
            
            client = await db.clients.find_one({"id": machine['client_id']}, {"_id": 0})
            operator = None
            if machine.get('operator_id'):
                operator = await db.operators.find_one({"id": machine['operator_id']}, {"_id": 0})
            
            calculations = await calculate_reading(reading_data, machine, client, operator)
            
            reading = Reading(
                machine_id=reading_data.machine_id,
                previous_in=reading_data.previous_in,
                previous_out=reading_data.previous_out,
                current_in=reading_data.current_in,
                current_out=reading_data.current_out,
                reading_date=reading_data.reading_date or datetime.now(timezone.utc),
                **calculations
            )
            
            doc = reading.model_dump()
            doc['reading_date'] = doc['reading_date'].isoformat()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.readings.insert_one(doc)
            
            imported += 1
        except Exception as e:
            errors.append(f"Error in row: {str(e)}")
    
    return {"imported": imported, "errors": errors}

@api_router.delete("/readings/{reading_id}")
async def delete_reading(reading_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.readings.delete_one({"id": reading_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reading not found")
    return {"message": "Reading deleted"}

# ========== REPORTS ==========

@api_router.get("/reports/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_machines = await db.machines.count_documents({"active": True})
    total_clients = await db.clients.count_documents({})
    total_operators = await db.operators.count_documents({})
    
    # Calculate total revenue from readings
    readings = await db.readings.find({}, {"_id": 0}).to_list(10000)
    total_gross = sum(r['gross_value'] for r in readings)
    total_commissions = sum(r['client_commission'] + r['operator_commission'] for r in readings)
    total_net = sum(r['net_value'] for r in readings)
    
    return {
        "total_machines": total_machines,
        "total_clients": total_clients,
        "total_operators": total_operators,
        "total_readings": len(readings),
        "total_gross": round(total_gross, 2),
        "total_commissions": round(total_commissions, 2),
        "total_net": round(total_net, 2)
    }

@api_router.get("/reports/by-machine/{machine_id}")
async def get_machine_report(machine_id: str, current_user: dict = Depends(get_current_user)):
    machine = await db.machines.find_one({"id": machine_id}, {"_id": 0})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    readings = await db.readings.find({"machine_id": machine_id}, {"_id": 0}).sort("reading_date", -1).to_list(1000)
    
    for r in readings:
        if isinstance(r['reading_date'], str):
            r['reading_date'] = datetime.fromisoformat(r['reading_date'])
    
    total_gross = sum(r['gross_value'] for r in readings)
    total_net = sum(r['net_value'] for r in readings)
    
    return {
        "machine": machine,
        "readings": readings,
        "total_gross": round(total_gross, 2),
        "total_net": round(total_net, 2),
        "total_readings": len(readings)
    }

@api_router.get("/reports/by-client/{client_id}")
async def get_client_report(client_id: str, current_user: dict = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    machines = await db.machines.find({"client_id": client_id}, {"_id": 0}).to_list(1000)
    machine_ids = [m['id'] for m in machines]
    
    readings = await db.readings.find({"machine_id": {"$in": machine_ids}}, {"_id": 0}).sort("reading_date", -1).to_list(1000)
    
    for r in readings:
        if isinstance(r['reading_date'], str):
            r['reading_date'] = datetime.fromisoformat(r['reading_date'])
    
    total_gross = sum(r['gross_value'] for r in readings)
    total_commission = sum(r['client_commission'] for r in readings)
    
    return {
        "client": client,
        "machines": machines,
        "readings": readings,
        "total_gross": round(total_gross, 2),
        "total_commission": round(total_commission, 2),
        "total_readings": len(readings)
    }

@api_router.get("/reports/by-region/{region_id}")
async def get_region_report(region_id: str, current_user: dict = Depends(get_current_user)):
    region = await db.regions.find_one({"id": region_id}, {"_id": 0})
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    
    machines = await db.machines.find({"region_id": region_id}, {"_id": 0}).to_list(1000)
    machine_ids = [m['id'] for m in machines]
    
    readings = await db.readings.find({"machine_id": {"$in": machine_ids}}, {"_id": 0}).sort("reading_date", -1).to_list(1000)
    
    for r in readings:
        if isinstance(r['reading_date'], str):
            r['reading_date'] = datetime.fromisoformat(r['reading_date'])
    
    total_gross = sum(r['gross_value'] for r in readings)
    total_net = sum(r['net_value'] for r in readings)
    
    return {
        "region": region,
        "machines": machines,
        "readings": readings,
        "total_gross": round(total_gross, 2),
        "total_net": round(total_net, 2),
        "total_machines": len(machines)
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()