from fastapi import FastAPI, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

import models, schemas, crud
from database import SessionLocal, engine
from auth import authenticate_user, get_current_user, get_password_hash, get_db
from auth.jwt_utils import create_access_token, verify_token
from auth.password_reset import send_password_reset_email, reset_password_with_token
from auth.email_verification import send_verification_email, verify_email_token
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import BackgroundTasks

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()
# Serve the /uploads directory at http://localhost:8000/uploads/...
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Hamza don't forget to change this in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --------------------
# Helper
# --------------------
def require_admin(current_user: models.User):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )

# --------------------
# Registration (Admin-only)
# --------------------
@app.post("/register", response_model=schemas.UserOut)
def register_user(
    user: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    require_admin(current_user)
    existing_user = crud.get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role,
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    # Asynchronous email sending!
    background_tasks.add_task(send_verification_email, new_user.username)
    return new_user

# --------------------
# Email Verification
# --------------------
@app.get("/verify-email")
@app.get("/verify-email/")
def verify_email(token: str, db: Session = Depends(get_db)):
    payload = verify_email_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    username = payload.get("sub") or payload.get("username")
    user = crud.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    db.commit()
    return {"message": "Email verified successfully"}

# --------------------
# Password Reset
# --------------------
@app.post("/forgot-password")
def forgot_password(email: str = Form(...), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    from auth.jwt_utils import create_access_token
    token = create_access_token({"sub": user.username})
    send_password_reset_email(user.username, token)
    return {"message": "Password reset email sent"}

@app.post("/reset-password")
def reset_password(
    token: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    username = reset_password_with_token(db, token, new_password)
    if not username:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    return {"message": "Password updated successfully"}

# --------------------
# Login
# --------------------
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user or not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username, password, or unverified email",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --------------------
# Current Authenticated User
# --------------------
@app.get("/users/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --------------------
# Riders (Admin-only)
# --------------------
@app.get("/riders", response_model=list[schemas.Rider])
def read_riders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    require_admin(current_user)
    return crud.get_riders(db)

@app.post("/riders", response_model=schemas.Rider)
def create_rider(
    rider: schemas.RiderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    require_admin(current_user)
    return crud.create_rider(db, rider)

@app.put("/riders/{rider_id}", response_model=schemas.Rider)
def update_rider(
    rider_id: int,
    rider_update: schemas.RiderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    require_admin(current_user)
    rider = crud.get_rider(db, rider_id)
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")
    for key, value in rider_update.dict().items():
        setattr(rider, key, value)
    db.commit()
    db.refresh(rider)
    return rider

@app.delete("/riders/{rider_id}", status_code=204)
def delete_rider(
    rider_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    require_admin(current_user)
    rider = crud.get_rider(db, rider_id)
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")
    db.delete(rider)
    db.commit()
    return

# --------------------
# Inspections (All Authenticated Users)
# --------------------
@app.get("/inspections", response_model=list[schemas.Inspection])
def read_inspections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_inspections(db)

@app.post("/inspections", response_model=schemas.Inspection)
def create_inspection(
    rider_id: Optional[str] = Form(None),
    id_number: Optional[str] = Form(None),
    helmet_ok: bool = Form(...),
    box_ok: bool = Form(...),
    id_ok: bool = Form(...),
    zone_ok: bool = Form(...),
    clothes_ok: bool = Form(...),
    well_behaved: bool = Form(...),
    location: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    image: UploadFile = File(None),
    comments: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Convert empty string to None, else to int
    if rider_id is None or rider_id.strip() == "":
        resolved_rider_id = None
    else:
        try:
            resolved_rider_id = int(rider_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="rider_id must be an integer or blank")

    # Try to resolve rider_id from id_number if not provided
    if not resolved_rider_id and id_number:
        rider = db.query(models.Rider).filter(models.Rider.id_number == id_number).first()
        if rider:
            resolved_rider_id = rider.rider_id

    if not resolved_rider_id and not id_number and not location:
        raise HTTPException(
            status_code=422,
            detail="You must provide at least rider_id, id_number, or location for an inspection"
        )

    image_url = None
    if image:
        file_location = f"uploads/{image.filename}"
        with open(file_location, "wb") as f:
            f.write(image.file.read())
        image_url = file_location

    inspection = models.Inspection(
        rider_id=resolved_rider_id,
        id_number=id_number,
        inspected_by=current_user.username,
        helmet_ok=helmet_ok,
        box_ok=box_ok,
        id_ok=id_ok,
        zone_ok=zone_ok,
        clothes_ok=clothes_ok,
        well_behaved=well_behaved,
        location=location,
        city=city,
        image_url=image_url,
        comments=comments
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return inspection

@app.put("/inspections/{inspection_id}", response_model=schemas.Inspection)
def update_inspection(
    inspection_id: int,
    rider_id: Optional[int] = Form(None),
    id_number: Optional[str] = Form(None),
    helmet_ok: bool = Form(...),
    box_ok: bool = Form(...),
    id_ok: bool = Form(...),
    zone_ok: bool = Form(...),
    clothes_ok: bool = Form(...),
    well_behaved: bool = Form(...),
    location: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    comments: Optional[str] = Form(None), 
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    inspection = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    # Only admin or supervisor who created it
    if not (
        current_user.role == "admin" or
        (current_user.role == "supervisor" and inspection.inspected_by == current_user.username)
    ):
        raise HTTPException(status_code=403, detail="Permission denied")

    resolved_rider_id = rider_id
    if not resolved_rider_id and id_number:
        rider = db.query(models.Rider).filter(models.Rider.id_number == id_number).first()
        if rider:
            resolved_rider_id = rider.rider_id

    if image:
        file_location = f"uploads/{image.filename}"
        with open(file_location, "wb") as f:
            f.write(image.file.read())
        inspection.image_url = file_location

    inspection.rider_id = resolved_rider_id
    inspection.id_number = id_number
    inspection.helmet_ok = helmet_ok
    inspection.box_ok = box_ok
    inspection.id_ok = id_ok
    inspection.zone_ok = zone_ok
    inspection.clothes_ok = clothes_ok
    inspection.well_behaved = well_behaved
    inspection.location = location
    inspection.city = city
    inspection.comments = comments
    db.commit()
    db.refresh(inspection)
    return inspection

@app.delete("/inspections/{inspection_id}", status_code=204)
def delete_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    inspection = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    if not (
        current_user.role == "admin"
        or (current_user.role == "supervisor" and inspection.inspected_by == current_user.username)
    ):
        raise HTTPException(status_code=403, detail="Permission denied")
    db.delete(inspection)
    db.commit()
    return

@app.get("/inspections/search", response_model=list[schemas.Inspection])
def search_inspections(
    city: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Inspection)
    if city:
        query = query.filter(models.Inspection.city == city)
    if location:
        query = query.filter(models.Inspection.location == location)
    return query.all()