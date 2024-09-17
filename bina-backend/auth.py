from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import os
from pydantic import BaseModel
import secrets
import base64

def generate_secret_key(length=32):
    """Generate a random secret key."""
    return base64.urlsafe_b64encode(secrets.token_bytes(length)).decode('utf-8')

# Configuration
SECRET_KEY = generate_secret_key()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

class LoginCredentials(BaseModel):
    password: str

def generate_secret_key(length=32):
    """Generate a random secret key."""
    return base64.urlsafe_b64encode(secrets.token_bytes(length)).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expires = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expires})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_password(password: str) -> bool:
    # Replace this with your actual password verification logic
    return password == "1234"  # For testing purposes