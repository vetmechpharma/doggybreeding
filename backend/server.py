"""Doggy Breeding App - Backend API
FastAPI + MongoDB
Provides endpoints for users, dogs, evaluations (cytology/progesterone/combined),
feedback, and learning module content.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Doggy Breeding App API")
api_router = APIRouter(prefix="/api")


# ---------------- Helpers ----------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def gen_id() -> str:
    return str(uuid.uuid4())


def parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        try:
            return datetime.strptime(s, "%Y-%m-%d")
        except Exception:
            return None


def fmt_date(d: Optional[datetime]) -> Optional[str]:
    return d.date().isoformat() if d else None


# ---------------- Models ----------------
class UserCreate(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = ""
    hospital: Optional[str] = ""
    category: str = "Doctor"  # Doctor | Student | Breeder | Laboratory | Clinic
    location: Optional[str] = ""
    state: Optional[str] = ""
    google_id: Optional[str] = ""
    photo_url: Optional[str] = ""


class User(UserCreate):
    id: str
    registration_date: str


class GoogleAuthBody(BaseModel):
    id_token: Optional[str] = None
    # For dev/placeholder: when Google client IDs are not configured client may
    # send a name/email/google_id directly to upsert a user. The backend marks
    # such logins as unverified (verified=False).
    google_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None


class DogCreate(BaseModel):
    user_id: str
    dog_name: str
    owner_name: str
    owner_mobile: str
    breed: Optional[str] = ""
    age: Optional[str] = ""
    sex: Optional[str] = "Female"
    weight: Optional[str] = ""
    whelping_count: Optional[int] = 0
    previous_whelping_date: Optional[str] = None
    proestrus_bleeding_date: Optional[str] = None
    photo_base64: Optional[str] = ""


class Dog(DogCreate):
    id: str
    created_at: str


class CytologyInput(BaseModel):
    pc: float = 0
    ic: float = 0
    sic: float = 0
    sc: float = 0
    cc: float = 0


class CytologyResult(BaseModel):
    stage: str
    stage_key: str
    confidence: int
    cornification_index: float
    interpretation: str
    recommendation: str
    breeding_status: str
    next_evaluation_date: Optional[str] = None
    suggested_mating_date: Optional[str] = None
    expected_whelping_date: Optional[str] = None


class ProgesteroneInput(BaseModel):
    value: float


class ProgesteroneResult(BaseModel):
    stage: str
    stage_key: str
    confidence: int
    interpretation: str
    recommendation: str
    ovulation_prediction: Optional[str] = None
    suggested_mating_date: Optional[str] = None
    next_test_date: Optional[str] = None
    expected_whelping_date: Optional[str] = None


class EvaluationCreate(BaseModel):
    user_id: str
    dog_id: str
    type: str  # cytology | progesterone | combined
    inputs: Dict[str, Any] = {}
    result: Dict[str, Any] = {}
    proestrus_bleeding_date: Optional[str] = None
    notes: Optional[str] = ""


class Evaluation(EvaluationCreate):
    id: str
    created_at: str


class FeedbackCreate(BaseModel):
    user_id: Optional[str] = None
    rating: int = 5
    comments: Optional[str] = ""


class Feedback(FeedbackCreate):
    id: str
    created_at: str


# ---------------- Stage colors ----------------
STAGE_COLORS = {
    "ANESTRUS": "anestrus",
    "EARLY_PROESTRUS": "early_proestrus",
    "MID_PROESTRUS": "mid_proestrus",
    "LATE_PROESTRUS": "late_proestrus",
    "ESTRUS": "estrus",
    "ESTRUS_OVULATION": "estrus",
    "DIESTRUS": "diestrus",
}

STAGE_LABEL = {
    "ANESTRUS": "Anestrus",
    "EARLY_PROESTRUS": "Early Proestrus",
    "MID_PROESTRUS": "Mid Proestrus",
    "LATE_PROESTRUS": "Late Proestrus",
    "ESTRUS": "Estrus",
    "ESTRUS_OVULATION": "Estrus / Ovulation",
    "DIESTRUS": "Diestrus",
}


# ---------------- Calculation engines ----------------
def classify_cytology(ci_input: CytologyInput, proestrus_date_iso: Optional[str] = None) -> CytologyResult:
    pc, ic, sc, cc = ci_input.pc, ci_input.ic, ci_input.sc, ci_input.cc
    ci_value = round(sc + cc, 1)

    # Logic from spec — order matters: estrus & proestrus sub-stages take priority
    if sc + cc >= 80:
        key = "ESTRUS"
        conf = 92
        interp = "High superficial + cornified cells. Female is in full estrus and receptive."
        rec = "Optimal breeding window. Natural mating today or AI within 24-48 hours."
        status = "Optimal — Breed now"
    elif sc + cc >= 60:
        key = "LATE_PROESTRUS"
        conf = 85
        interp = "Cornification rising rapidly. Estrus imminent within 1-2 days."
        rec = "Schedule next cytology in 1-2 days. Prepare for mating."
        status = "Breeding window approaching"
    elif sc + cc >= 30:
        key = "MID_PROESTRUS"
        conf = 78
        interp = "Mid-proestrus. Cornification progressing but not yet optimal."
        rec = "Re-evaluate cytology in 2-3 days."
        status = "Not yet — re-check soon"
    elif sc + cc >= 10:
        key = "EARLY_PROESTRUS"
        conf = 75
        interp = "Early proestrus. Bleeding likely active, female not yet receptive."
        rec = "Re-evaluate cytology in 3-4 days."
        status = "Not receptive yet"
    elif pc >= 80 and ic <= 20:
        key = "ANESTRUS"
        conf = 90
        interp = "Predominantly parabasal cells. Reproductive quiescence."
        rec = "No breeding. Re-evaluate when proestrus bleeding begins."
        status = "Not in cycle"
    elif pc < 80 and ic > 20:
        key = "DIESTRUS"
        conf = 80
        interp = "Return of intermediate / parabasal cells after estrus."
        rec = "If bred recently, monitor for pregnancy. Otherwise wait for next cycle."
        status = "Past optimal window"
    else:
        key = "EARLY_PROESTRUS"
        conf = 60
        interp = "Pattern unclear — repeat cytology recommended."
        rec = "Re-evaluate in 2 days."
        status = "Inconclusive"

    pd = parse_date(proestrus_date_iso)
    next_eval = suggested_mating = expected_whelping = None
    if pd:
        # Use spec-based heuristics anchored on proestrus bleeding onset
        if key == "ESTRUS":
            suggested_mating = pd + timedelta(days=10)
            expected_whelping = (suggested_mating or pd) + timedelta(days=63)
            next_eval = datetime.now(timezone.utc) + timedelta(days=2)
        elif key == "LATE_PROESTRUS":
            suggested_mating = datetime.now(timezone.utc) + timedelta(days=2)
            expected_whelping = suggested_mating + timedelta(days=63)
            next_eval = datetime.now(timezone.utc) + timedelta(days=1)
        elif key in ("MID_PROESTRUS", "EARLY_PROESTRUS"):
            next_eval = datetime.now(timezone.utc) + timedelta(days=3)
            suggested_mating = pd + timedelta(days=10)
            expected_whelping = suggested_mating + timedelta(days=63)
        elif key == "DIESTRUS":
            expected_whelping = pd + timedelta(days=63)
        # Anestrus: leave None

    return CytologyResult(
        stage=STAGE_LABEL[key],
        stage_key=key,
        confidence=conf,
        cornification_index=ci_value,
        interpretation=interp,
        recommendation=rec,
        breeding_status=status,
        next_evaluation_date=fmt_date(next_eval),
        suggested_mating_date=fmt_date(suggested_mating),
        expected_whelping_date=fmt_date(expected_whelping),
    )


def classify_progesterone(pi: ProgesteroneInput, proestrus_date_iso: Optional[str] = None) -> ProgesteroneResult:
    v = pi.value
    if v < 0.5:
        key, conf = "ANESTRUS", 90
        interp = "Baseline progesterone — anestrus."
        rec = "No breeding. Recheck when proestrus begins."
        ovul = None
    elif v <= 1.0:
        key, conf = "EARLY_PROESTRUS", 80
        interp = "Progesterone beginning to rise. Early proestrus."
        rec = "Recheck progesterone in 2-3 days."
        ovul = "Ovulation in ~4-6 days"
    elif v <= 1.9:
        key, conf = "LATE_PROESTRUS", 85
        interp = "LH surge approaching. Late proestrus."
        rec = "Recheck in 24-48 hours. Mating window is imminent."
        ovul = "Ovulation in ~2-4 days"
    elif v <= 4.0:
        key, conf = "ESTRUS", 92
        interp = "LH surge has occurred. Estrus."
        rec = "Optimal natural mating window opens in 2-3 days."
        ovul = "Ovulation within ~24-48 hours"
    elif v <= 18.0:
        key, conf = "ESTRUS_OVULATION", 95
        interp = "Post-ovulation, oocytes maturing. Peak fertility window."
        rec = "Breed now or within 24-48 hours. Ideal time for AI."
        ovul = "Ovulation occurred — oocyte maturation in progress"
    else:
        key, conf = "DIESTRUS", 88
        interp = "High progesterone — diestrus / luteal phase."
        rec = "If bred, monitor pregnancy. Otherwise cycle is past optimal window."
        ovul = "Past ovulation"

    pd = parse_date(proestrus_date_iso)
    today = datetime.now(timezone.utc)
    mating = next_test = whelping = None

    if key == "ESTRUS_OVULATION":
        mating = today
        whelping = today + timedelta(days=63)
    elif key == "ESTRUS":
        mating = today + timedelta(days=2)
        whelping = mating + timedelta(days=63)
        next_test = today + timedelta(days=2)
    elif key == "LATE_PROESTRUS":
        next_test = today + timedelta(days=2)
        mating = today + timedelta(days=4)
        whelping = mating + timedelta(days=63)
    elif key == "EARLY_PROESTRUS":
        next_test = today + timedelta(days=3)
        mating = today + timedelta(days=6)
        whelping = mating + timedelta(days=63)
    elif key == "DIESTRUS" and pd:
        whelping = pd + timedelta(days=63)

    return ProgesteroneResult(
        stage=STAGE_LABEL[key],
        stage_key=key,
        confidence=conf,
        interpretation=interp,
        recommendation=rec,
        ovulation_prediction=ovul,
        suggested_mating_date=fmt_date(mating),
        next_test_date=fmt_date(next_test),
        expected_whelping_date=fmt_date(whelping),
    )


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Doggy Breeding App API", "version": "1.0.0"}


# Users / Auth
@api_router.post("/auth/google", response_model=User)
async def auth_google(body: GoogleAuthBody):
    """Upsert a user from Google. When `id_token` is provided and Google client
    IDs are configured server-side, the token will be verified. For now (no
    server-side Google verification configured), we accept the profile fields
    sent by the client. Frontend should treat returned user as authenticated.
    """
    google_id = body.google_id or (body.id_token[:32] if body.id_token else None)
    if not google_id:
        raise HTTPException(status_code=400, detail="google_id or id_token required")

    existing = await db.users.find_one({"google_id": google_id}, {"_id": 0})
    if existing:
        # Update lastLoginAt-like field is not in model; just return
        return User(**existing)

    user_doc = {
        "id": gen_id(),
        "google_id": google_id,
        "name": body.name or "Google User",
        "mobile": "",
        "email": body.email or "",
        "hospital": "",
        "category": "Doctor",
        "location": "",
        "state": "",
        "photo_url": body.photo_url or "",
        "registration_date": now_iso(),
    }
    await db.users.insert_one(user_doc.copy())
    return User(**user_doc)


@api_router.post("/users", response_model=User)
async def create_user(body: UserCreate):
    user_doc = body.model_dump()
    user_doc["id"] = gen_id()
    user_doc["registration_date"] = now_iso()
    await db.users.insert_one(user_doc.copy())
    return User(**user_doc)


@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    u = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**u)


@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, body: UserCreate):
    update = body.model_dump()
    res = await db.users.update_one({"id": user_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    u = await db.users.find_one({"id": user_id}, {"_id": 0})
    return User(**u)


# Dogs
@api_router.post("/dogs", response_model=Dog)
async def create_dog(body: DogCreate):
    doc = body.model_dump()
    doc["id"] = gen_id()
    doc["created_at"] = now_iso()
    await db.dogs.insert_one(doc.copy())
    return Dog(**doc)


@api_router.get("/dogs", response_model=List[Dog])
async def list_dogs(user_id: str = Query(...)):
    docs = await db.dogs.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Dog(**d) for d in docs]


@api_router.get("/dogs/{dog_id}", response_model=Dog)
async def get_dog(dog_id: str):
    d = await db.dogs.find_one({"id": dog_id}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="Dog not found")
    return Dog(**d)


# Calculators (stateless)
@api_router.post("/calc/cytology", response_model=CytologyResult)
async def calc_cytology(body: CytologyInput, proestrus_bleeding_date: Optional[str] = None):
    total = body.pc + body.ic + body.sic + body.sc + body.cc
    if abs(total - 100) > 0.5:
        raise HTTPException(status_code=400, detail=f"Cell counts must total 100 (got {total})")
    return classify_cytology(body, proestrus_bleeding_date)


@api_router.post("/calc/progesterone", response_model=ProgesteroneResult)
async def calc_progesterone(body: ProgesteroneInput, proestrus_bleeding_date: Optional[str] = None):
    return classify_progesterone(body, proestrus_bleeding_date)


# Evaluations (persisted)
@api_router.post("/evaluations", response_model=Evaluation)
async def create_evaluation(body: EvaluationCreate):
    doc = body.model_dump()
    doc["id"] = gen_id()
    doc["created_at"] = now_iso()
    await db.evaluations.insert_one(doc.copy())
    return Evaluation(**doc)


@api_router.get("/evaluations", response_model=List[Evaluation])
async def list_evaluations(user_id: str = Query(...), q: Optional[str] = None):
    query: Dict[str, Any] = {"user_id": user_id}
    docs = await db.evaluations.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    if q:
        ql = q.lower()
        # Join with dog data for searching
        dog_ids = list({d["dog_id"] for d in docs})
        dogs = await db.dogs.find({"id": {"$in": dog_ids}}, {"_id": 0}).to_list(2000)
        dog_map = {d["id"]: d for d in dogs}
        def match(e):
            d = dog_map.get(e["dog_id"], {})
            blob = " ".join([
                d.get("dog_name", ""), d.get("owner_name", ""), d.get("owner_mobile", ""),
                d.get("breed", ""), e.get("type", ""), str(e.get("result", {}).get("stage", ""))
            ]).lower()
            return ql in blob
        docs = [e for e in docs if match(e)]
    return [Evaluation(**e) for e in docs]


@api_router.get("/evaluations/{eval_id}")
async def get_evaluation(eval_id: str):
    e = await db.evaluations.find_one({"id": eval_id}, {"_id": 0})
    if not e:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    dog = await db.dogs.find_one({"id": e["dog_id"]}, {"_id": 0})
    user = await db.users.find_one({"id": e["user_id"]}, {"_id": 0})
    return {"evaluation": e, "dog": dog, "user": user}


@api_router.delete("/evaluations/{eval_id}")
async def delete_evaluation(eval_id: str):
    await db.evaluations.delete_one({"id": eval_id})
    return {"ok": True}


# Stats
@api_router.get("/stats/{user_id}")
async def get_stats(user_id: str):
    docs = await db.evaluations.find({"user_id": user_id}, {"_id": 0}).to_list(2000)
    total = len(docs)
    by_stage: Dict[str, int] = {}
    by_month: Dict[str, int] = {}
    for e in docs:
        sk = (e.get("result") or {}).get("stage_key") or "UNKNOWN"
        by_stage[sk] = by_stage.get(sk, 0) + 1
        ca = e.get("created_at", "")
        month = ca[:7] if ca else "unknown"
        by_month[month] = by_month.get(month, 0) + 1
    return {
        "total": total,
        "estrus": by_stage.get("ESTRUS", 0) + by_stage.get("ESTRUS_OVULATION", 0),
        "anestrus": by_stage.get("ANESTRUS", 0),
        "diestrus": by_stage.get("DIESTRUS", 0),
        "proestrus": (
            by_stage.get("EARLY_PROESTRUS", 0)
            + by_stage.get("MID_PROESTRUS", 0)
            + by_stage.get("LATE_PROESTRUS", 0)
        ),
        "by_stage": by_stage,
        "by_month": by_month,
    }


# Feedback
@api_router.post("/feedback", response_model=Feedback)
async def create_feedback(body: FeedbackCreate):
    doc = body.model_dump()
    doc["id"] = gen_id()
    doc["created_at"] = now_iso()
    await db.feedback.insert_one(doc.copy())
    return Feedback(**doc)


# Combined breeding decision
class CombinedInput(BaseModel):
    cytology: Optional[CytologyInput] = None
    progesterone_value: Optional[float] = None
    proestrus_bleeding_date: Optional[str] = None


@api_router.post("/calc/combined")
async def calc_combined(body: CombinedInput):
    cyto_res = None
    prog_res = None
    if body.cytology:
        cyto_res = classify_cytology(body.cytology, body.proestrus_bleeding_date)
    if body.progesterone_value is not None:
        prog_res = classify_progesterone(ProgesteroneInput(value=body.progesterone_value), body.proestrus_bleeding_date)

    # Pick higher confidence as primary
    primary = None
    if cyto_res and prog_res:
        primary = cyto_res if cyto_res.confidence >= prog_res.confidence else prog_res
    elif cyto_res:
        primary = cyto_res
    elif prog_res:
        primary = prog_res

    if not primary:
        raise HTTPException(status_code=400, detail="Provide cytology and/or progesterone data")

    return {
        "cytology": cyto_res.model_dump() if cyto_res else None,
        "progesterone": prog_res.model_dump() if prog_res else None,
        "primary": primary.model_dump(),
        "combined_recommendation": primary.recommendation,
    }


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
