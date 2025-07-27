from sqlalchemy.orm import Session
import models, schemas



def get_riders(db: Session):
    return db.query(models.Rider).all()

def get_rider(db: Session, rider_id: int):
    return db.query(models.Rider).filter(models.Rider.rider_id == rider_id).first()

def create_rider(db: Session, rider: schemas.RiderCreate):
    db_rider = models.Rider(
        first_name=rider.first_name,
        first_last_name=rider.first_last_name,
        id_number=rider.id_number,
        city_code=rider.city_code,
        vehicle_type=rider.vehicle_type,
        joined_at=rider.joined_at  # Accept value from frontend, can be None (in which case DB default is used)
    )
    db.add(db_rider)
    db.commit()
    db.refresh(db_rider)
    return db_rider

def get_inspections(db: Session):
    return db.query(models.Inspection).all()

def create_inspection(db: Session, inspection: schemas.InspectionCreate):
    db_inspection = models.Inspection(**inspection.dict())
    db.add(db_inspection)
    db.commit()
    db.refresh(db_inspection)
    return db_inspection

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

