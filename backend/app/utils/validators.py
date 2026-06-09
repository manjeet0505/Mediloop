import re
from fastapi import HTTPException

def validate_email(email: str) -> str:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise HTTPException(status_code=422, detail="Invalid email format")
    return email.lower().strip()

def validate_password(password: str) -> str:
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=422, detail="Password must contain at least one uppercase letter")
    if not re.search(r'[0-9]', password):
        raise HTTPException(status_code=422, detail="Password must contain at least one number")
    if not re.search(r'[!@#$%^&*]', password):
        raise HTTPException(status_code=422, detail="Password must contain at least one special character (!@#$%^&*)")
    return password

def validate_phone(phone: str) -> str:
    pattern = r'^\+91[6-9]\d{9}$'
    if not re.match(pattern, phone):
        raise HTTPException(status_code=422, detail="Invalid phone number. Use format: +91XXXXXXXXXX")
    return phone

def validate_name(name: str) -> str:
    if len(name.strip()) < 2:
        raise HTTPException(status_code=422, detail="Name must be at least 2 characters")
    if re.search(r'[<>{}();\'"\\]', name):
        raise HTTPException(status_code=422, detail="Name contains invalid characters")
    return name.strip()