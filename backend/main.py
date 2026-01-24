import os
import httpx
import json
import time
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth

from database import get_db_service
from models import User, DailyQuota

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
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "temporary-secret-key-change-it")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'infomap.db')}")

app = FastAPI(title="InfoMap API Pro")

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
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

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
    redirect_uri = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, str(redirect_uri))

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
    with Session(db_service.engine) as session:
        statement = select(User)
        users = session.exec(statement).all()
        return users

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
    today = datetime.now().strftime('%Y-%m-%d')
    db_user = db_service.get_or_create_user(user['email'])
    count = db_service.get_daily_count(db_user.id, today)
    return {
        "date": today,
        "count": count,
        "max": db_user.max_daily_quota
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}

async def get_country_stats(country):
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://restcountries.com/v3.1/name/{country}?fullText=true"
            response = await client.get(url, timeout=10.0)
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
async def get_country_news(
    country: str, 
    time_filter: str = "24h", 
    topic: str = "General",
    user: dict = Depends(get_current_user)
):
    if not country or country == "undefined":
        raise HTTPException(status_code=400, detail="Invalid country name.")
    
    today = datetime.now().strftime('%Y-%m-%d')
    email = user['email']
    
    if not db_service.has_quota_remaining(email, today):
        logger.warning(f"Quota EXCEEDED for {email}")
        raise HTTPException(status_code=429, detail="Daily API quota reached.")

    if time_filter not in ["24h", "7d"]:
        time_filter = "24h"
    if topic not in ["General", "Economy", "Politics", "Tech", "Military"]:
        topic = "General"

    time_str = "au cours des dernières 24 heures" if time_filter == "24h" else "strictement depuis lundi dernier (cette semaine)"
    
    templates = {
        "General": f"Identifie les 5 événements majeurs qui font actuellement la une en {country}. Privilégie les faits marquants ayant un impact national {time_str}.",
        "Politics": f"Cherche les 5 développements les plus importants concernant la politique intérieure, le gouvernement, les élections et les nouvelles législations en {country} {time_str}.",
        "Economy": f"Fais un rapport sur les 5 points clés de l'actualité économique en {country} {time_str}.",
        "Tech": f"Quelles sont les 5 actualités technologiques et scientifiques les plus marquantes en {country} {time_str} ?",
        "Military": f"Analyse la situation sécuritaire en {country} {time_str}."
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
        "Tu es un analyste de renseignement expert. Retourne UNIQUEMENT un objet JSON valide contenant :\n"
        "1. 'news': une liste de 5 items avec 'titre', 'date', 'source_url'.\n"
        "PAS de texte introductif, juste le JSON."
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

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(PERPLEXITY_URL, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            stats = await stats_task
            ai_content = data["choices"][0]["message"]["content"]
            
            clean_content = ai_content.replace("```json", "").replace("```", "").strip()
            json_data = json.loads(clean_content)
            news_list = json_data.get("news", [])
            
            db_user = db_service.get_or_create_user(email)
            new_count = db_service.increment_quota(db_user.id, today)
            
            return {
                "country": country, "time_filter": time_filter, "topic": topic,
                "news": news_list, "trends": json_data.get("trends", []), "stats": stats,
                "from_cache": False, "quota": new_count
            }
        except Exception as e:
            logger.error(f"API Error: {str(e)}")
            raise HTTPException(status_code=500, detail="Erreur de service news.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)