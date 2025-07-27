# dependencies.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth.auth import get_current_user

def get_current_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return user

def get_current_supervisor(user: User = Depends(get_current_user)):
    if user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Supervisors only")
    return user