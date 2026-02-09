import os
import httpx
import json
import time
import logging
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional, List

# Helper for Paris time
def get_paris_now():
    return datetime.now(ZoneInfo("Europe/Paris"))

def get_paris_today():
    return get_paris_now().strftime('%Y-%m-%d')

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import get_db_service
from models import User, DailyQuota, QueryHistory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("infomap-api")

# Use absolute path for .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path=env_path)

# Auth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'infomap.db')}")

# Security: Ensure SESSION_SECRET_KEY is set in production
if not SESSION_SECRET_KEY:
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise ValueError("SESSION_SECRET_KEY must be set in production environment")
    else:
        SESSION_SECRET_KEY = "dev-only-insecure-key-do-not-use-in-production"
        logger.warning("⚠️  Using insecure default SESSION_SECRET_KEY - NOT for production!")

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="InfoMap API Pro")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Session Middleware
app.add_middleware(
    SessionMiddleware, 
    secret_key=SESSION_SECRET_KEY,
    max_age=3600 * 24 * 7  # 7 days
)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth Setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Database Service
db_service = get_db_service(DATABASE_URL)

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://infomap.ovh")

# Global HTTPX AsyncClient for better connection pooling
http_client: Optional[httpx.AsyncClient] = None

@app.on_event("startup")
async def startup_event():
    global http_client
    http_client = httpx.AsyncClient(timeout=30.0)
    logger.info("Global HTTPX AsyncClient initialized")

@app.on_event("shutdown")
async def shutdown_event():
    global http_client
    if http_client:
        await http_client.aclose()
        logger.info("Global HTTPX AsyncClient closed")

# --- Dependencies ---

async def get_current_user(request: Request):
    user = request.session.get('user')
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db_user = db_service.get_or_create_user(user['email'])
    if not db_user.is_active:
        request.session.pop('user', None)
        raise HTTPException(status_code=403, detail="User not authorized")
    
    return user

async def get_admin_user(user: dict = Depends(get_current_user)):
    db_user = db_service.get_or_create_user(user['email'])
    if not db_user.is_admin:
        logger.warning(f"Unauthorized admin access attempt by {user['email']}")
        raise HTTPException(status_code=403, detail="Admin access required")
    return db_user

# --- Models for Admin ---
class QuotaUpdate(BaseModel):
    email: str
    max_daily_quota: int

class UserStatusUpdate(BaseModel):
    email: str
    is_active: bool

class UserCreate(BaseModel):
    email: str
    is_active: bool = True
    max_daily_quota: int = 5

# --- Auth Routes ---

@app.get("/login")
async def login(request: Request):
    # In production, force the exact URL expected by Google
    if request.base_url.hostname == "infomap.ovh":
        redirect_uri = "https://infomap.ovh/api/auth"
    else:
        redirect_uri = str(request.url_for('auth'))
    
    logger.info(f"Redirecting to Google with URI: {redirect_uri}")

    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth")
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = token.get('userinfo')
        if not userinfo:
            userinfo = await oauth.google.parse_id_token(request, token)
        
        if userinfo:
            email = userinfo.get("email")
            db_user = db_service.get_or_create_user(email)
            
            if not db_user.is_active:
                logger.warning(f"Unauthorized login attempt: {email}")
                return RedirectResponse(url=f"{FRONTEND_URL}?error=unauthorized")

            request.session['user'] = {
                "email": email,
                "name": userinfo.get("name"),
                "picture": userinfo.get("picture")
            }
            logger.info(f"User logged in: {email}")
            
    except Exception as e:
        logger.error(f"Auth error: {e}")
    
    return RedirectResponse(url=FRONTEND_URL)

@app.get("/logout")
async def logout(request: Request):
    request.session.pop('user', None)
    return RedirectResponse(url=FRONTEND_URL)

@app.get("/me")
async def get_me(request: Request):
    user = request.session.get('user')
    if not user:
        return {"authenticated": False}
    
    db_user = db_service.get_or_create_user(user['email'])
    return {
        "authenticated": True,
        "user": user,
        "is_admin": db_user.is_admin
    }

# --- Admin Routes ---

@app.get("/admin/users")
async def list_users(admin: User = Depends(get_admin_user)):
    from sqlmodel import Session, select
    today = get_paris_today()
    with Session(db_service.engine) as session:
        statement = select(User)
        users = session.exec(statement).all()
        
        # Enrich users with today's query count
        enriched_users = []
        for user in users:
            count = db_service.get_daily_count(user.id, today)
            user_data = user.dict()
            user_data['today_count'] = count
            enriched_users.append(user_data)
        
        return enriched_users

@app.post("/admin/quota")
async def update_user_quota(update: QuotaUpdate, admin: User = Depends(get_admin_user)):
    from sqlmodel import Session, select
    with Session(db_service.engine) as session:
        statement = select(User).where(User.email == update.email)
        user = session.exec(statement).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.max_daily_quota = update.max_daily_quota
        session.add(user)
        session.commit()
        logger.info(f"Admin {admin.email} updated quota for {update.email} to {update.max_daily_quota}")
        return {"status": "success", "email": update.email, "new_quota": user.max_daily_quota}

@app.post("/admin/users")
async def create_user(user_data: UserCreate, admin: User = Depends(get_admin_user)):
    from sqlmodel import Session, select
    with Session(db_service.engine) as session:
        statement = select(User).where(User.email == user_data.email)
        existing = session.exec(statement).first()
        if existing:
            raise HTTPException(status_code=400, detail="User already exists")
        
        new_user = User(
            email=user_data.email, 
            is_active=user_data.is_active, 
            max_daily_quota=user_data.max_daily_quota
        )
        session.add(new_user)
        session.commit()
        logger.info(f"Admin {admin.email} created user {user_data.email}")
        return {"status": "success", "user": new_user}

@app.patch("/admin/user/status")
async def toggle_user_status(update: UserStatusUpdate, admin: User = Depends(get_admin_user)):
    from sqlmodel import Session, select
    with Session(db_service.engine) as session:
        statement = select(User).where(User.email == update.email)
        user = session.exec(statement).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.email == admin.email:
             raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

        user.is_active = update.is_active
        session.add(user)
        session.commit()
        logger.info(f"Admin {admin.email} set status of {update.email} to {update.is_active}")
        return {"status": "success", "email": update.email, "is_active": user.is_active}

@app.delete("/admin/user/{email}")
async def delete_user(email: str, admin: User = Depends(get_admin_user)):
    from sqlmodel import Session, select
    with Session(db_service.engine) as session:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.email == admin.email:
             raise HTTPException(status_code=400, detail="Cannot delete yourself")

        session.delete(user)
        session.commit()
        logger.info(f"Admin {admin.email} deleted user {email}")
        return {"status": "success", "deleted": email}

# --- News & Quota Routes ---

@app.get("/quota")
async def check_quota(user: dict = Depends(get_current_user)):
    today = get_paris_today()
    db_user = db_service.get_or_create_user(user['email'])
    count = db_service.get_daily_count(db_user.id, today)
    return {
        "date": today,
        "count": count,
        "max": db_user.max_daily_quota
    }

# --- History Routes ---

@app.get("/history")
async def get_history(user: dict = Depends(get_current_user)):
    """Get user's query history (last 20 items, max 4h old)"""
    from sqlmodel import Session, select
    from datetime import timedelta
    
    db_user = db_service.get_or_create_user(user['email'])
    cutoff = datetime.utcnow() - timedelta(hours=4)
    
    with Session(db_service.engine) as session:
        statement = (
            select(QueryHistory)
            .where(QueryHistory.user_id == db_user.id)
            .where(QueryHistory.created_at >= cutoff)
            .order_by(QueryHistory.created_at.desc())
            .limit(20)
        )
        history = session.exec(statement).all()
        
        return [
            {
                "id": h.id,
                "country": h.country,
                "time_filter": h.time_filter,
                "topic": h.topic,
                "news": json.loads(h.news_json),
                "stats": json.loads(h.stats_json) if h.stats_json else None,
                "timestamp": h.created_at.isoformat()
            }
            for h in history
        ]

@app.delete("/history/{history_id}")
async def delete_history_item(history_id: int, user: dict = Depends(get_current_user)):
    """Delete a specific history item"""
    from sqlmodel import Session, select
    
    db_user = db_service.get_or_create_user(user['email'])
    
    with Session(db_service.engine) as session:
        statement = select(QueryHistory).where(
            QueryHistory.id == history_id,
            QueryHistory.user_id == db_user.id
        )
        item = session.exec(statement).first()
        if not item:
            raise HTTPException(status_code=404, detail="History item not found")
        
        session.delete(item)
        session.commit()
        return {"status": "success", "deleted_id": history_id}

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}

async def get_country_stats(country):
    global http_client
    try:
        url = f"https://restcountries.com/v3.1/name/{country}?fullText=true"
        response = await http_client.get(url, timeout=10.0)
        if response.status_code == 200:
            data = response.json()[0]
            return {
                "population": data.get("population", "N/A"),
                "region": data.get("region", "N/A"),
                "subregion": data.get("subregion", "N/A"),
                "capital": data.get("capital", ["N/A"])[0],
                "flag_emoji": data.get("flag", "")
            }
    except Exception as e:
        logger.error(f"Error fetching country stats for {country}: {e}")
    return None

@app.get("/news/{country}")
@limiter.limit("10/minute")
async def get_country_news(
    request: Request,
    country: str, 
    time_filter: str = "24h", 
    topic: str = "General",
    user: dict = Depends(get_current_user)
):
    if not country or country == "undefined":
        raise HTTPException(status_code=400, detail="Invalid country name.")
    
    today = get_paris_today()
    email = user['email']
    
    if not db_service.has_quota_remaining(email, today):
        logger.warning(f"Quota EXCEEDED for {email}")
        raise HTTPException(status_code=429, detail="Daily API quota reached.")

    if time_filter not in ["24h", "7d"]:
        time_filter = "24h"
    if topic not in ["General", "Economy", "Politics", "Tech", "Military"]:
        topic = "General"

    time_str = "in the last 24 hours" if time_filter == "24h" else "strictly since last Monday (this week)"
    
    templates = {
        "General": f"Identify the 5 major events currently making headlines in {country}. Focus on significant facts with national impact {time_str}.",
        "Politics": f"Find the 5 most important developments regarding domestic politics, government, elections and new legislation in {country} {time_str}.",
        "Economy": f"Report on the 5 key economic news items in {country} {time_str}.",
        "Tech": f"What are the 5 most notable tech and science news stories in {country} {time_str}?",
        "Military": f"Analyze the security situation in {country} {time_str}."
    }

    user_prompt = templates[topic]
    stats_task = get_country_stats(country)
    
    if not PERPLEXITY_API_KEY:
        stats = await stats_task
        mock_data = [{"titre": f"[{topic}] News in {country}", "date": today, "source_url": "#"}] * 5
        return {
            "country": country, "time_filter": time_filter, "topic": topic,
            "news": mock_data, "trends": [], "stats": stats, "from_cache": False,
            "quota": db_service.get_daily_count(db_service.get_or_create_user(email).id, today)
        }

    system_prompt = (
        "You are an expert intelligence analyst. Return ONLY a valid JSON object containing:\n"
        "1. 'news': a list of 5 items with 'titre', 'date', 'source_url'.\n"
        "NO introductory text, just the JSON."
    )
    
    headers = {"Authorization": f"Bearer {PERPLEXITY_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1
    }

    global http_client
    try:
        response = await http_client.post(PERPLEXITY_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        stats = await stats_task
        ai_content = data["choices"][0]["message"]["content"]
        
        clean_content = ai_content.replace("```json", "").replace("```", "").strip()
        json_data = json.loads(clean_content)
        news_list = json_data.get("news", [])
        
        db_user = db_service.get_or_create_user(email)
        new_count = db_service.increment_quota(db_user.id, today)
        
        # Save to history
        from sqlmodel import Session
        with Session(db_service.engine) as session:
            history_item = QueryHistory(
                user_id=db_user.id,
                country=country,
                time_filter=time_filter,
                topic=topic,
                news_json=json.dumps(news_list),
                stats_json=json.dumps(stats) if stats else None
            )
            session.add(history_item)
            session.commit()
            logger.info(f"History saved for {email}: {country}/{topic}")
        
        return {
            "country": country, "time_filter": time_filter, "topic": topic,
            "news": news_list, "trends": json_data.get("trends", []), "stats": stats,
            "from_cache": False, "quota": new_count
        }
    except Exception as e:
        logger.error(f"API Error: {str(e)}")
        raise HTTPException(status_code=500, detail="News service error.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)