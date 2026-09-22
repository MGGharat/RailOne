from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.models import User, UserRole, AuditLog
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, RefreshTokenRequest, UserOut, UserUpdate
from app.api.deps import get_current_user
from app.core.exceptions import AppException, success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    if user_in.confirm_password and user_in.confirm_password != user_in.password:
        raise AppException(status_code=400, code="PASSWORD_MISMATCH", message="Passwords do not match.")

    # Check if email exists
    if db.query(User).filter(User.email == user_in.email.lower()).first():
        raise AppException(status_code=400, code="EMAIL_EXISTS", message="An account with this email already exists.")
    
    if db.query(User).filter(User.mobile == user_in.mobile).first():
        raise AppException(status_code=400, code="MOBILE_EXISTS", message="An account with this mobile number already exists.")

    name = user_in.full_name
    if not name and (user_in.first_name or user_in.last_name):
        name = f"{user_in.first_name or ''} {user_in.last_name or ''}".strip()
    if not name:
        name = user_in.email.split("@")[0]

    new_user = User(
        email=user_in.email.lower(),
        mobile=user_in.mobile,
        hashed_password=get_password_hash(user_in.password),
        full_name=name,
        gender=user_in.gender or "MALE",
        dob=user_in.dob,
        address=user_in.address,
        role=UserRole.USER,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(new_user.id)
    refresh_token = create_refresh_token(new_user.id)

    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": UserOut.model_validate(new_user).model_dump()
        },
        message="Registration successful"
    )

@router.post("/login")
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    identifier = (login_in.email or login_in.mobile or login_in.username or "").strip()
    if not identifier:
        raise AppException(status_code=400, code="MISSING_CREDENTIALS", message="Email or mobile number is required.")

    user = db.query(User).filter(
        (User.email == identifier.lower()) | (User.mobile == identifier)
    ).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise AppException(status_code=401, code="INVALID_CREDENTIALS", message="Invalid email or password.")

    if not user.is_active:
        raise AppException(status_code=403, code="ACCOUNT_INACTIVE", message="Account is deactivated.")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": UserOut.model_validate(user).model_dump()
        },
        message="Login successful"
    )

@router.post("/refresh")
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise AppException(status_code=401, code="INVALID_TOKEN", message="Invalid or expired refresh token.")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise AppException(status_code=401, code="INVALID_USER", message="User not found or inactive.")

    new_access_token = create_access_token(user.id)
    return success_response(
        data={
            "access_token": new_access_token,
            "token_type": "bearer"
        },
        message="Token refreshed successfully"
    )

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return success_response(
        data=UserOut.model_validate(current_user).model_dump(),
        message="Profile retrieved"
    )

@router.put("/me")
def update_me(
    update_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if update_in.full_name:
        current_user.full_name = update_in.full_name
    if update_in.mobile:
        current_user.mobile = update_in.mobile
    if update_in.gender:
        current_user.gender = update_in.gender
    if update_in.dob:
        current_user.dob = update_in.dob
    if update_in.address:
        current_user.address = update_in.address

    db.commit()
    db.refresh(current_user)
    return success_response(
        data=UserOut.model_validate(current_user).model_dump(),
        message="Profile updated successfully"
    )
