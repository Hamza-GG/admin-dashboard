from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status

import models  # Make sure this import works in your project!
from auth.auth import get_password_hash  # Adjust if your hash function is elsewhere

SECRET_KEY = "superlongsecretthatshouldbeidenticalinALLfiles"  # Use env vars in production!
ALGORITHM = "HS256"

# Send password reset email - username is the email
def send_password_reset_email(username: str, token: str):
    # Dummy logic (replace with real email sending)
    print(f"Sending password reset email to {username} with token {token}")

def reset_password_with_token(db, token: str, new_password: str):
    payload = verify_token(token)
    if not payload:
        print("Invalid token payload")
        return None
    username = payload.get("sub")
    if not username:
        print("No username in token")
        return None
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        print("User not found")
        return None
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    return username

# Generate token for email verification or password reset
def create_token(data: dict, expires_minutes: int = 60):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Verify the token and return the payload
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

# Create a token specifically for password reset or email verification
def create_password_reset_token(username: str):
    return create_token({"sub": username}, expires_minutes=30)

def create_email_verification_token(username: str):
    return create_token({"sub": username}, expires_minutes=60*24)  # e.g. 24 hours

# Example to extract username (email) from token payload
def get_username_from_token(token: str):
    payload = verify_token(token)
    username = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=400, detail="Invalid token payload")
    return username


