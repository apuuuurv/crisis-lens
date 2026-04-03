from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import os

from app.database import get_db
from app.models.core import User
from app.schemas.user import UserCreate, UserResponse, Token
from app.auth.security import get_password_hash, verify_password, create_access_token

# Define the token URL for Swagger UI to find the login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- DEPENDENCIES ---

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Decodes the JWT token to find the user in the database.
    This allows us to know WHO is making the request.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # These constants come from your .env via your security config
        # If you haven't moved them to a config file, use os.getenv here
        SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-jwt-key")
        ALGORITHM = os.getenv("ALGORITHM", "HS256")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

class RoleChecker:
    """
    A reusable dependency to restrict routes to specific roles.
    """
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        # Normalize role (handle Enum or String)
        user_role = user.role.value if hasattr(user.role, "value") else user.role
        
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {self.allowed_roles}"
            )
        return user

# Define these for easy importing in other files
allow_admin_only = RoleChecker(["admin"])
allow_any_user = RoleChecker(["admin", "citizen"])

# --- ROUTES ---

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    
    # Ensure role is handled as string if it's coming from an Enum in the schema
    role_val = user.role.value if hasattr(user.role, "value") else user.role

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=role_val
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_role = user.role.value if hasattr(user.role, "value") else user.role
    access_token = create_access_token(data={"sub": str(user.id), "role": user_role})
    
    return {"access_token": access_token, "token_type": "bearer", "role": user_role}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Test endpoint to verify the token is working and returns the user's details.
    """
    return current_user