from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
from auth.jwt_utils import create_jwt_token, verify_jwt_token
from database import get_db
from models import User
from fastapi_mail import FastMail, MessageSchema
from mail_config import conf

router = APIRouter()

async def send_verification_email(username: str):
    from fastapi_mail import FastMail, MessageSchema  # just in case

    token = create_jwt_token({"username": username}, expires_delta=timedelta(hours=24))
    verification_link = f"http://localhost:8000/verify-email?token={token}"
    message = MessageSchema(
        subject="Verify your email",
        recipients=[username],
        body=f"Please verify your email by clicking this link: <a href='{verification_link}'>{verification_link}</a>",
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)

@router.post("/register")
def register_user(user_data: dict, db: Session = Depends(get_db)):
    # Create user in DB with is_verified=False
    user = User(**user_data)
    user.is_verified = False
    db.add(user)
    db.commit()
    db.refresh(user)

    # Use username (email) for sending the verification email
    send_verification_email(user.username)
    return {"msg": "Registration successful, check email to verify"}

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    payload = verify_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    username = payload.get("username")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.commit()
    return {"msg": "Email verified successfully"}

def verify_email_token(token: str):
    return verify_jwt_token(token)