from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "supervisor"

class UserOut(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class RiderBase(BaseModel):
    first_name: str
    first_last_name: str
    id_number: str
    city_code: Optional[str] = None
    vehicle_type: Optional[str] = None
    joined_at: Optional[datetime] = None
    
class RiderCreate(RiderBase):
    pass

class Rider(RiderBase):
    rider_id: int
    joined_at: datetime

    class Config:
        orm_mode = True

# --- Inspections ---

class InspectionBase(BaseModel):
    rider_id: Optional[int] = None   # Can be null if unknown
    id_number: Optional[str] = None
    inspected_by: str
    helmet_ok: bool
    box_ok: bool
    id_ok: bool
    zone_ok: bool
    clothes_ok: bool
    well_behaved: bool
    city: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    comments: Optional[str] = None
class InspectionCreate(InspectionBase):
    pass

class InspectionUpdate(BaseModel):
    rider_id: Optional[int] = None
    id_number: Optional[str] = None
    inspected_by: Optional[str] = None
    helmet_ok: Optional[bool] = None
    box_ok: Optional[bool] = None
    id_ok: Optional[bool] = None
    zone_ok: Optional[bool] = None
    clothes_ok: Optional[bool] = None
    well_behaved: Optional[bool] = None
    city: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    comments: Optional[str] = None
class Inspection(InspectionBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True