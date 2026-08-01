from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import bcrypt
import os, logging, uuid, base64, io, json, re
from pathlib import Path
from PyPDF2 import PdfReader
from youtube_transcript_api import YouTubeTranscriptApi
import requests
from PIL import Image
from google import genai
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
OCR_API_KEY = os.environ.get('OCR_API_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    password_hash: str
    subscription_tier: str = "free"
    subscription_expiry: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    uploads_this_month: int = 0
    last_upload_reset: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudyMaterial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    type: str
    content_text: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Flashcard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    material_id: str
    question: str
    answer: str
    interval: int = 1
    ease_factor: float = 2.5
    next_review_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc)) 
    last_reviewed: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc)) 

class ReviewLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    flashcard_id: str
    user_id: str
    rating: str
    reviewed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Tree(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    species: str = "seed"
    growth_level: int = 0
    watered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    unlocked_species: List[str] = Field(default_factory=lambda: ["seed", "sprout"])

class Streak(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    last_study_date: Optional[datetime] = None

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    cards_reviewed: int = 0
    correct_count: int = 0
    incorrect_count: int = 0

# ==================== HELPERS ====================
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user = await db.users.find_one({"id": payload.get("sub")})
        if not user: raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

async def check_upload_limit(user: dict) -> bool:
    if user['subscription_tier'] == 'premium': 
        return True
    
    last_reset = user.get('last_upload_reset')
    now = datetime.now(timezone.utc)
    
    if isinstance(last_reset, datetime) and last_reset.tzinfo is None:
        last_reset = last_reset.replace(tzinfo=timezone.utc)
    elif not last_reset:
        last_reset = now

    if now - last_reset > timedelta(days=30):
        await db.users.update_one(
            {"id": user['id']}, 
            {"$set": {"uploads_this_month": 0, "last_upload_reset": now}}
        )
        return True
        
    return user.get('uploads_this_month', 0) < 3

def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf_reader = PdfReader(io.BytesIO(file_content))
        return "\n".join([page.extract_text() or "" for page in pdf_reader.pages]).strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to extract PDF text")

def extract_text_from_image(file_content: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(file_content))
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        response = requests.post("https://api.ocr.space/parse/image", data={
            'apikey': OCR_API_KEY, 'base64Image': f'data:image/png;base64,{img_base64}', 'language': 'eng'
        })
        result = response.json()
        if result.get('IsErroredOnProcessing'): raise Exception(result.get('ErrorMessage'))
        return result.get('ParsedResults', [{}])[0].get('ParsedText', '').strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to extract image text")

def extract_youtube_transcript(url: str) -> str:
    try:
        video_id = url.split('youtu.be/')[-1].split('?')[0] if 'youtu.be/' in url else url.split('v=')[-1].split('&')[0]
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join([item['text'] for item in transcript]).strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to extract YouTube transcript")

async def generate_questions_with_ai(text: str, title: str) -> List[Dict[str, Any]]:
    try:

        client = genai.Client(api_key=GEMINI_API_KEY)
        
        prompt = f"""You are an expert educational content creator. Generate 5 high-quality flashcard questions from the following material titled "{title}".

For each question, provide:
1. The question text
2. The correct answer (must be a concise, direct answer)
3. A brief explanation

Material:
{text[:3000]}

Return ONLY valid JSON in this exact format. Do NOT include markdown formatting like ```json. Just return the raw JSON array:
[
  {{
    "type": "flashcard",
    "question": "What is...",
    "correct_answer": "The direct answer...",
    "explanation": "Brief explanation..."
  }}
]
"""
        
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
        full_response = response.text
        
        # 1. Strip markdown code blocks if the AI adds them
        clean_response = full_response.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response[7:]
        if clean_response.startswith("```"):
            clean_response = clean_response[3:]
        if clean_response.endswith("```"):
            clean_response = clean_response[:-3]
        clean_response = clean_response.strip()

        # 2. Extract the JSON array
        json_match = re.search(r'\[.*\]', clean_response, re.DOTALL)
        if json_match:
            questions = json.loads(json_match.group())
            
            # 3. Validate that questions aren't empty or malformed
            valid_questions = []
            for q in questions:
                if isinstance(q, dict) and q.get("question") and q.get("correct_answer"):
                    valid_questions.append(q)
            
            if valid_questions:
                return valid_questions
                
        raise Exception("Failed to parse valid questions from AI response")
        
    except Exception as e:
        logger.error(f"Error generating questions with AI: {e}")
        # 4. Better fallback that explains the issue
        return [
            {
                "type": "flashcard",
                "question": f"What are the key concepts in {title}?",
                "correct_answer": "The AI failed to generate specific questions. Please review the uploaded material manually.",
                "explanation": "Check your backend logs for API errors (e.g., invalid API key)."
            }
        ]
    
def calculate_next_review(rating: str, interval: int, ease: float) -> tuple:
    if rating == "again": return 1, max(1.3, ease - 0.2)
    elif rating == "hard": return max(1, int(interval * 1.2)), max(1.3, ease - 0.15)
    elif rating == "good": return int(interval * ease), ease
    else: return int(interval * ease * 1.3), min(2.5, ease + 0.15)

# ==================== ROUTES ====================
@api_router.post("/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    if await db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=user_data.email, name=user_data.name, password_hash=hash_password(user_data.password))
    await db.users.insert_one(user.model_dump())
    await db.trees.insert_one(Tree(user_id=user.id).model_dump())
    await db.streaks.insert_one(Streak(user_id=user.id).model_dump())
    return {"access_token": create_access_token({"sub": user.id}), "token_type": "bearer", "user": {"id": user.id, "email": user.email, "name": user.name, "subscription_tier": user.subscription_tier}}

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_access_token({"sub": user['id']}), "token_type": "bearer", "user": {"id": user['id'], "email": user['email'], "name": user['name'], "subscription_tier": user['subscription_tier']}}

@api_router.post("/materials/upload/text")
async def upload_text(title: str = Form(...), content: str = Form(...), current_user: dict = Depends(get_current_user)):
    if not await check_upload_limit(current_user): raise HTTPException(status_code=403, detail="Upload limit reached")
    material = StudyMaterial(user_id=current_user['id'], title=title, type="text", content_text=content)
    await db.study_materials.insert_one(material.model_dump())
    questions = await generate_questions_with_ai(content, title)
    await db.question_sets.insert_one({"material_id": material.id, "user_id": current_user['id'], "questions": questions, "generated_at": datetime.now(timezone.utc)})
    for q in questions:
        await db.flashcards.insert_one(Flashcard(user_id=current_user['id'], material_id=material.id, question=q['question'], answer=q['correct_answer']).model_dump())
    await db.users.update_one({"id": current_user['id']}, {"$inc": {"uploads_this_month": 1}})
    return {"material_id": material.id, "questions_generated": len(questions)}

@api_router.post("/materials/upload/pdf")
async def upload_pdf(title: str = Form(...), file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not await check_upload_limit(current_user): raise HTTPException(status_code=403, detail="Upload limit reached")
    text = extract_text_from_pdf(await file.read())
    material = StudyMaterial(user_id=current_user['id'], title=title, type="pdf", content_text=text)
    await db.study_materials.insert_one(material.model_dump())
    questions = await generate_questions_with_ai(text, title)
    await db.question_sets.insert_one({"material_id": material.id, "user_id": current_user['id'], "questions": questions, "generated_at": datetime.now(timezone.utc)})
    for q in questions:
        await db.flashcards.insert_one(Flashcard(user_id=current_user['id'], material_id=material.id, question=q['question'], answer=q['correct_answer']).model_dump())
    await db.users.update_one({"id": current_user['id']}, {"$inc": {"uploads_this_month": 1}})
    return {"material_id": material.id, "questions_generated": len(questions)}

@api_router.post("/materials/upload/image")
async def upload_image(title: str = Form(...), file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not await check_upload_limit(current_user): raise HTTPException(status_code=403, detail="Upload limit reached")
    text = extract_text_from_image(await file.read())
    material = StudyMaterial(user_id=current_user['id'], title=title, type="image", content_text=text)
    await db.study_materials.insert_one(material.model_dump())
    questions = await generate_questions_with_ai(text, title)
    await db.question_sets.insert_one({"material_id": material.id, "user_id": current_user['id'], "questions": questions, "generated_at": datetime.now(timezone.utc)})
    for q in questions:
        await db.flashcards.insert_one(Flashcard(user_id=current_user['id'], material_id=material.id, question=q['question'], answer=q['correct_answer']).model_dump())
    await db.users.update_one({"id": current_user['id']}, {"$inc": {"uploads_this_month": 1}})
    return {"material_id": material.id, "questions_generated": len(questions)}

@api_router.post("/materials/upload/youtube")
async def upload_youtube(title: str = Form(...), url: str = Form(...), current_user: dict = Depends(get_current_user)):
    if not await check_upload_limit(current_user): raise HTTPException(status_code=403, detail="Upload limit reached")
    text = extract_youtube_transcript(url)
    material = StudyMaterial(user_id=current_user['id'], title=title, type="youtube", content_text=text)
    await db.study_materials.insert_one(material.model_dump())
    questions = await generate_questions_with_ai(text, title)
    await db.question_sets.insert_one({"material_id": material.id, "user_id": current_user['id'], "questions": questions, "generated_at": datetime.now(timezone.utc)})
    for q in questions:
        await db.flashcards.insert_one(Flashcard(user_id=current_user['id'], material_id=material.id, question=q['question'], answer=q['correct_answer']).model_dump())
    await db.users.update_one({"id": current_user['id']}, {"$inc": {"uploads_this_month": 1}})
    return {"material_id": material.id, "questions_generated": len(questions)}

@api_router.get("/materials")
async def get_materials(current_user: dict = Depends(get_current_user)):
    materials = await db.study_materials.find({"user_id": current_user['id']}).sort("uploaded_at", -1).to_list(100)
    for m in materials:
        m["id"] = str(m.pop("_id"))  
    return materials

@api_router.get("/flashcards/due")
async def get_due_flashcards(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    flashcards = await db.flashcards.find({
        "user_id": current_user['id'], 
        "next_review_date": {"$lte": now}
    }).to_list(1000)
    
    for f in flashcards:
        f["id"] = str(f.pop("_id"))
    
    # ✅ ADD THIS LINE:
    print(f"BACKEND DEBUG: Sending {len(flashcards)} cards to user {current_user.get('email')}")
    
    return {"due_count": len(flashcards), "flashcards": flashcards}

@api_router.post("/flashcards/{flashcard_id}/review")
async def review_flashcard(flashcard_id: str, rating: str, current_user: dict = Depends(get_current_user)):
    if rating not in ['again', 'hard', 'good', 'easy']: 
        raise HTTPException(status_code=400, detail="Invalid rating")    
    try:
        flashcard = await db.flashcards.find_one({"_id": ObjectId(flashcard_id), "user_id": current_user['id']})
    except Exception:
        flashcard = None
        
    if not flashcard: 
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    new_interval, new_ease = calculate_next_review(rating, flashcard['interval'], flashcard['ease_factor'])
    next_review = datetime.now(timezone.utc) + timedelta(days=new_interval)
    
    await db.flashcards.update_one(
        {"_id": flashcard["_id"]}, 
        {"$set": {"interval": new_interval, "ease_factor": new_ease, "next_review_date": next_review, "last_reviewed": datetime.now(timezone.utc)}}
    )
    
    await db.review_logs.insert_one(ReviewLog(flashcard_id=str(flashcard["_id"]), user_id=current_user['id'], rating=rating).model_dump())
    
    tree = await db.trees.find_one({"user_id": current_user['id']})
    if tree:
        growth_change = 2 if rating in ['good', 'easy'] else (0 if rating == 'hard' else -1)
        await db.trees.update_one({"user_id": current_user['id']}, {"$set": {"growth_level": max(0, min(100, tree['growth_level'] + growth_change)), "watered_at": datetime.now(timezone.utc)}})
    
    streak = await db.streaks.find_one({"user_id": current_user['id']})
    if streak:
        today = datetime.now(timezone.utc).date()
        last_study = streak.get('last_study_date')
        if last_study:
            last_date = last_study.date() if isinstance(last_study, datetime) else last_study
            days_diff = (today - last_date).days
            if days_diff == 1:
                new_streak = streak['current_streak'] + 1
                await db.streaks.update_one({"user_id": current_user['id']}, {"$set": {"current_streak": new_streak, "longest_streak": max(new_streak, streak['longest_streak']), "last_study_date": datetime.now(timezone.utc)}})
            elif days_diff > 1:
                await db.streaks.update_one({"user_id": current_user['id']}, {"$set": {"current_streak": 1, "last_study_date": datetime.now(timezone.utc)}})
        else:
            await db.streaks.update_one({"user_id": current_user['id']}, {"$set": {"current_streak": 1, "last_study_date": datetime.now(timezone.utc)}})
    
    return {"next_review_date": next_review, "new_interval": new_interval}

@api_router.get("/tree")
async def get_tree(current_user: dict = Depends(get_current_user)):
    tree = await db.trees.find_one({"user_id": current_user['id']})
    if not tree:
        tree = Tree(user_id=current_user['id']).model_dump()
    else:
        tree["id"] = str(tree.pop("_id"))
    
    growth = tree['growth_level']
    tree['species'] = "seed" if growth < 10 else "sprout" if growth < 30 else "sapling" if growth < 60 else "tree"
    return tree

@api_router.get("/streak")
async def get_streak(current_user: dict = Depends(get_current_user)):
    streak = await db.streaks.find_one({"user_id": current_user['id']})
    if not streak:
        streak = Streak(user_id=current_user['id']).model_dump()
    else:
        streak["id"] = str(streak.pop("_id"))  
    return streak

@api_router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    total_cards = await db.flashcards.count_documents({"user_id": current_user['id']})
    mastered = await db.flashcards.count_documents({"user_id": current_user['id'], "interval": {"$gte": 30}})
    reviews = await db.review_logs.count_documents({"user_id": current_user['id']})
    streak = await db.streaks.find_one({"user_id": current_user['id']}) or {"current_streak": 0, "longest_streak": 0}
    due_today = await db.flashcards.count_documents({"user_id": current_user['id'], "next_review_date": {"$lte": datetime.now(timezone.utc)}})
    
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent = await db.review_logs.find({"user_id": current_user['id'], "reviewed_at": {"$gte": thirty_days_ago}}).to_list(10000)
    reviews_by_date = {}
    for r in recent:
        date = r['reviewed_at'].date().isoformat()
        reviews_by_date[date] = reviews_by_date.get(date, 0) + 1
        
    return {"total_cards": total_cards, "mastered_cards": mastered, "total_study_time_minutes": reviews * 2, "current_streak": streak['current_streak'], "longest_streak": streak['longest_streak'], "due_today": due_today, "reviews_by_date": reviews_by_date}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()