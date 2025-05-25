from fastapi import HTTPException , Depends , status , Header
import jwt
SECRET_KEY = "123"
ALGORITHM = "HS256"

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        # if payload.get("type") != "teacher":
        #     raise ValueError("Unauthorized")
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")

async def get_current_user_id(authorization: str = Header(...)):
    # Typically, Authorization header looks like: "Bearer <token>"
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    token = authorization[len("Bearer "):]

    try:
        payload = verify_token(token)
        user_id = payload.get("id")  # or "sub" or whichever key you use
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return user_id
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))