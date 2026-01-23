import os
import httpx
import json
import time
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Use absolute path for .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path=env_path)

QUOTA_FILE = os.path.join(BASE_DIR, 'quota.json')
CACHE_FILE = os.path.join(BASE_DIR, 'cache.json')
DAILY_LIMIT = 15
CACHE_EXPIRY = 4 * 3600  # 4 hours in seconds (as requested for refresh frequency)

app = FastAPI(title="InfoMap API Pro")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"

# --- Helper Functions ---

async def get_country_stats(country):
    """Fetch population and other stats from REST Countries API."""
    try:
        async with httpx.AsyncClient() as client:
            # We search by name. REST Countries v3.1
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
        print(f"Error fetching country stats: {e}")
    return None

def get_quota():
    """Returns the current quota. Resets automatically at midnight (UTC/Server Time)."""
    today = datetime.now().strftime('%Y-%m-%d')
    if not os.path.exists(QUOTA_FILE):
        return {"date": today, "count": 0}
    
    try:
        with open(QUOTA_FILE, 'r') as f:
            data = json.load(f)
            # If the stored date is not today, we reset the count to 0
            if data.get("date") != today:
                return {"date": today, "count": 0}
            return data
    except (FileNotFoundError, json.JSONDecodeError, KeyError) as e:
        print(f"Quota read error/reset: {e}")
        return {"date": today, "count": 0}

def update_quota():
    quota = get_quota()
    quota["count"] += 1
    with open(QUOTA_FILE, 'w') as f:
        json.dump(quota, f)
    return quota["count"]

def get_cached_news(country):
    if not os.path.exists(CACHE_FILE):
        return None
    try:
        with open(CACHE_FILE, 'r') as f:
            cache = json.load(f)
            # 1. Try exact key match
            item = cache.get(country)
            
            # 2. Strategy: Falling back to simple country name if composite key fails
            # This handles the transition and provides a default if relevant
            if not item and "_" in country:
                simple_country = country.split('_')[0]
                item = cache.get(simple_country)
            
            if item and (time.time() - item['timestamp'] < CACHE_EXPIRY):
                return item['data']
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Cache read error: {e}")
        return None
    return None

def set_cached_news(country, data):
    cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                cache = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            pass
    
    cache[country] = {
        "timestamp": time.time(),
        "data": data
    }
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f)

# --- Routes ---

@app.get("/quota")
async def check_quota():
    return get_quota()

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}

@app.get("/news/{country}")
async def get_country_news(country: str, time_filter: str = "24h", topic: str = "General"):
    if not country or country == "undefined":
        raise HTTPException(status_code=400, detail="Invalid country name.")
    
    # Supported filters check
    if time_filter not in ["24h", "7d"]:
        time_filter = "24h"
    
    if topic not in ["General", "Economy", "Politics", "Tech", "Military"]:
        topic = "General"

    # Time string builder
    time_str = "au cours des dernières 24 heures" if time_filter == "24h" else "strictement depuis lundi dernier (cette semaine)"
    
    # Specialized Expert Templates
    templates = {
        "General": f"Identifie les 5 événements majeurs qui font actuellement la une en {country}. Privilégie les faits marquants ayant un impact national {time_str}.",
        "Politics": f"Cherche les 5 développements les plus importants concernant la politique intérieure, le gouvernement, les élections et les nouvelles législations en {country} {time_str}. Ignore les faits divers.",
        "Economy": f"Fais un rapport sur les 5 points clés de l'actualité économique en {country} {time_str}. Concentre-toi sur : la macroéconomie (PIB, Inflation), les décisions de la banque centrale, les marchés boursiers locaux et les annonces majeures des grandes entreprises.",
        "Tech": f"Quelles sont les 5 actualités technologiques et scientifiques les plus marquantes en {country} {time_str} ? Couvre un large spectre incluant : l'intelligence artificielle, les innovations digitales, la cyber-sécurité, ainsi que les activités majeures des grandes entreprises tech et les avancées scientifiques.",
        "Military": f"Analyse la situation sécuritaire en {country} {time_str}. Liste les 5 informations critiques concernant : la défense nationale, les acquisitions militaires, les tensions aux frontières, les alliances stratégiques et les opérations de renseignement."
    }

    user_prompt = templates[topic]

    # 1. Check Cache with composite key: [Pays]_[Temps]_[Sujet]
    cache_key = f"{country}_{time_filter}_{topic}"
    cached = get_cached_news(cache_key)
    
    # Check if cached is a dict and has "news" (legacy data check)
    if isinstance(cached, dict) and "news" in cached:
        print(f"Cache HIT for {cache_key}")
        return {
            "country": country, 
            "time_filter": time_filter,
            "topic": topic,
            "news": cached["news"], 
            "trends": cached.get("trends", []),
            "stats": cached.get("stats"),
            "from_cache": True, 
            "quota": get_quota()["count"]
        }
    elif cached:
        print(f"Cache legacy/invalid for {cache_key}, ignoring.")
    # If it's a list (legacy) or other type, we skip it and fetch fresh data

    # 2. Check Quota
    quota = get_quota()
    if quota["count"] >= DAILY_LIMIT:
        print(f"Quota EXCEEDED for {country}")
        raise HTTPException(status_code=429, detail="Daily API quota reached (Max 20).")

    # 3. Fetch Country Stats (Concurrent)
    stats_task = get_country_stats(country)
    
    # 4. Call API for News & Trends
    if not PERPLEXITY_API_KEY:
        stats = await stats_task
        mock_data = [
            {"titre": f"[{topic}] Event in {country}", "date": "2024-01-22", "source_url": "https://example.com/1"},
            {"titre": f"[{topic}] Update for {country}", "date": "2024-01-21", "source_url": "https://example.com/2"},
            {"titre": f"[{topic}] Developments", "date": "2024-01-20", "source_url": "https://example.com/3"},
            {"titre": f"[{topic}] Report", "date": "2024-01-19", "source_url": "https://example.com/4"},
            {"titre": f"[{topic}] News", "date": "2024-01-18", "source_url": "https://example.com/5"},
        ]
        mock_trends = ["#Stability", "#Growth", "#Innovation"]
        return {
            "country": country, 
            "time_filter": time_filter,
            "topic": topic,
            "news": mock_data, 
            "trends": mock_trends,
            "stats": stats,
            "from_cache": False, 
            "quota": quota["count"]
        }

    print(f"Calling Perplexity for {country} [{time_filter} | {topic}] (Quota: {quota['count']}/{DAILY_LIMIT})")
    
    system_prompt = (
        "Tu es un analyste de renseignement expert. Ta mission est d'identifier les informations les plus critiques et factuelles.\n"
        "Sources : Privilégie les agences de presse majeures (Reuters, AP, AFP), les médias nationaux réputés et les rapports officiels. Ignore les tabloïds, les rumeurs non vérifiées et le contenu promotionnel.\n"
        "CONTENU : Assure-toi que les 5 items traitent de SUJETS DIFFÉRENTS. Évite absolument les doublons ou plusieurs news sur un même événement précis.\n"
        "Format : Retourne UNIQUEMENT un objet JSON valide contenant :\n"
        "1. 'news': une liste de 5 items. Chaque item doit avoir : 'titre', 'date', 'source_url'.\n"
        "IMPORTANT : Le champ 'titre' doit être du texte pur. Ne mets JAMAIS de Markdown (pas de #, **, ##, etc.).\n"
        "LE CHAMP 'date' DOIT TOUJOURS ÊTRE AU FORMAT : 'JJ Mois AAAA' (ex: '22 Janvier 2026').\n"
        "PAS de résumé, PAS de texte introductif, juste le JSON."
    )
    
    # API Call with refined dynamic prompt
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1
    }

    async with httpx.AsyncClient() as client:
        ai_content = ""
        try:
            response = await client.post(PERPLEXITY_URL, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            # Fetch stats if not already done
            stats = await stats_task

            ai_content = data["choices"][0]["message"]["content"]

            # Try to parse the clean JSON
            try:
                clean_content = ai_content.replace("```json", "").replace("```", "").strip()
                json_data = json.loads(clean_content)
                news_list = json_data.get("news", [])
                trends = json_data.get("trends", [])
            except Exception as parse_err:
                # Provide a more user-friendly message if the model refused or returned text
                print(f"JSON Parse error: {parse_err}. Content snippet: {ai_content[:100]}...")
                if len(ai_content) > 10 and not ai_content.strip().startswith("{"):
                     # This is likely a text refusal from the LLM
                     raise HTTPException(status_code=404, detail="Signal non détecté : L'IA n'a pas trouvé d'informations fiables pour ces critères.")
                raise HTTPException(status_code=500, detail="Erreur de décryptage du signal (format invalide).")


            # 5. Update Quota & Cache
            new_count = update_quota()
            combined_data = {"news": news_list, "trends": trends, "stats": stats}
            set_cached_news(cache_key, combined_data)
            
            return {
                "country": country, 
                "time_filter": time_filter,
                "topic": topic,
                "news": news_list, 
                "trends": trends,
                "stats": stats,
                "from_cache": False, 
                "quota": new_count
            }
            
        except HTTPException as he:
            # Ensure stats_task is cleaned up even on HTTP errors
            try: await stats_task
            except Exception: pass
            raise he
        except Exception as e:
            # Ensure stats_task is cleaned up even on general errors
            try: await stats_task
            except Exception: pass
            print(f"API Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Interruption du signal : {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
