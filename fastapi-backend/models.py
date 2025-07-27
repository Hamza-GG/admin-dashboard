from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)  # This will store the email
    hashed_password = Column(String)
    role = Column(String, default="user")
    is_verified = Column(Boolean, default=False)

class Rider(Base):
    __tablename__ = "riders"

    rider_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(Text, nullable=False)
    first_last_name = Column(Text, nullable=False)
    id_number = Column(Text, nullable=False)
    city_code = Column(Text)
    vehicle_type = Column(Text)
    joined_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    inspections = relationship("Inspection", back_populates="rider")

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("riders.rider_id"), nullable=True)
    id_number = Column(Text, nullable=True)
    inspected_by = Column(Text, nullable=False)
    helmet_ok = Column(Boolean, nullable=False)
    box_ok = Column(Boolean, nullable=False)
    id_ok = Column(Boolean, nullable=False)
    zone_ok = Column(Boolean, nullable=False)
    clothes_ok = Column(Boolean, nullable=False)
    well_behaved = Column(Boolean, nullable=False)
    city = Column(String, nullable=True)       
    location = Column(String, nullable=True)     
    image_url = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)  # <---- add this line
    timestamp = Column(TIMESTAMP, server_default=func.current_timestamp())

    rider = relationship("Rider", back_populates="inspections")