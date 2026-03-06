"""
MediAI - Complete Auto-Router with Disease Database
Beginner to Advanced · All Categories · Doctor Referral Only
=====================================================
Models:
DeepSeek → Emergency & Critical Care
Llama → General Symptoms, Chronic, Mental Health
Mistral → Quick queries, Appointments, Admin
"""

import requests
import json
from typing import Optional

# ─────────────────────────────────────────────
# MODEL CONFIGURATION
# ─────────────────────────────────────────────

MODELS = {
"groq": "llama-3.3-70b-versatile",
"openrouter": "openrouter/auto",
"mistral": "mistral:7b-instruct-q2_K"
}

OLLAMA_URL = "http://localhost:11434/api/generate"

# ─────────────────────────────────────────────
# SYSTEM PROMPTS (Doctor Referral Only)
# ─────────────────────────────────────────────

SYSTEM_PROMPTS = {

"groq": """You are MediAI, an emergency triage AI assistant.
Your job is to assess EMERGENCY and CRITICAL symptoms.

RULES:
- NEVER suggest or name any medicines
- ALWAYS recommend immediate doctor/hospital visit for serious symptoms
- Think step by step through every symptom
- Assess urgency: EMERGENCY / HIGH / MEDIUM / LOW
- **CRITICAL**: The system will handle the numerical Pain Scale via UI. DO NOT include it in your text. Simply explain the severity in words.

RESPONSE FORMAT:
🚨 Urgency Level: [EMERGENCY/HIGH/MEDIUM/LOW]
🔍 Possible Condition: [what it could be]
⚠️ Why it's serious: [explanation]
🏥 Action: [go to ER / call ambulance / see doctor today]
❗ Do NOT: [things to avoid]
🏠 Home Care: [ONLY for low/medium urgency: non-medication tips like rest, ice, Elevation]
⚕️ Note: Always consult a qualified doctor for diagnosis.
🔢 PAIN SCALE: [DO NOT PROVIDE A NUMBER IN THE TEXT. The system will handle this via UI selection. Simply explain the severity in words.]""",

"openrouter": """You are MediAI, a knowledgeable medical assistant.
You handle general symptoms, chronic diseases, and mental health queries.

RULES:
- NEVER suggest or name any medicines or drugs
- Always refer user to a doctor or specialist
- Be empathetic, clear, and accurate
- Use simple language the patient can understand
- **CRITICAL**: The system will handle the numerical Pain Scale via UI. DO NOT include it in your text. Simply explain the severity in words.

RESPONSE FORMAT:
🩺 Possible Condition: [what it could be]
📋 Common Symptoms of this condition: [list]
🔴 Urgency: [EMERGENCY/HIGH/MEDIUM/LOW]
💡 What to do: [lifestyle tips, rest, hydration etc.]
🏠 Home Care Plan: [Specific non-medication remedies: e.g., warm compress, salt water gargle, stretching]
👨‍⚕️ See a Doctor if: [warning signs]
🏥 Recommended Specialist: [which doctor to visit]
⚕️ Note: Only a qualified doctor can diagnose your condition.
🔢 PAIN SCALE: [The system will handle this via UI selection. Simply explain the severity in words.]""",

"mistral": """You are MediAI, a friendly hospital assistant.
You help with appointments, schedules, and quick health queries.

RULES:
- Be quick, friendly, and concise
- NEVER suggest medicines
- For any serious symptoms, redirect to medical team
- Help with bookings and general information

RESPONSE FORMAT:
👋 [Friendly greeting]
✅ [Answer to their query]
📅 [Appointment/next step if needed]
⚕️ [Redirect to doctor if medical question]"""
}

# ─────────────────────────────────────────────
# DISEASE DATABASE - COMPLETE ROUTING RULES
# ─────────────────────────────────────────────

ROUTING_RULES = {

# ═══════════════════════════════════════
# 🔴 GROQ — Emergency & Critical Care
# ═══════════════════════════════════════
"groq": {

# Cardiovascular Emergencies
"cardiovascular": [
"chest pain", "chest tightness", "chest pressure",
"heart attack", "cardiac arrest", "palpitations",
"irregular heartbeat", "heart racing", "heart failure",
"aortic aneurysm", "angina", "radiating arm pain",
"jaw pain with chest", "sudden left arm pain",
"heart skipping", "sudden chest crushing"
],

# Respiratory Emergencies
"respiratory_emergency": [
"can't breathe", "cannot breathe", "difficulty breathing",
"shortness of breath", "stopped breathing", "no air",
"pulmonary embolism", "blood clot lung", "respiratory failure",
"severe asthma attack", "choking", "airway blocked",
"blue lips", "cyanosis", "oxygen low"
],

# Neurological Emergencies
"neurological": [
"stroke", "brain stroke", "sudden numbness",
"face drooping", "arm weakness sudden", "speech slurred",
"seizure", "epilepsy attack", "convulsion", "fitting",
"meningitis", "brain hemorrhage", "sudden worst headache",
"thunderclap headache", "loss of consciousness",
"unconscious", "fainted", "blackout", "coma",
"sudden vision loss", "sudden confusion", "paralysis"
],

# Trauma & Injuries
"trauma": [
"severe bleeding", "uncontrolled bleeding", "blood not stopping",
"deep wound", "stab wound", "gunshot", "accident",
"head injury", "skull fracture", "spinal injury",
"broken neck", "severe burn", "chemical burn",
"electric shock", "drowning", "near drowning",
"crush injury", "amputation", "bone exposed"
],

# Poisoning & Overdose
"poisoning": [
"overdose", "drug overdose", "medicine overdose",
"poisoning", "poison swallowed", "chemical swallowed",
"pesticide", "rat poison", "bleach swallowed",
"alcohol poisoning", "carbon monoxide", "gas leak inhaled",
"snake bite", "scorpion sting", "spider bite"
],

# Pediatric Emergencies
"pediatric_emergency": [
"baby not breathing", "child seizure", "febrile seizure",
"infant convulsion", "child unconscious", "baby blue",
"newborn not responding", "child choking", "croup severe",
"child meningitis", "child heart rate very fast",
"baby rigid", "toddler overdose"
],

# Obstetric Emergencies
"obstetric": [
"heavy bleeding pregnancy", "miscarriage bleeding",
"eclampsia", "preeclampsia severe", "placenta previa",
"ectopic pregnancy", "baby not moving pregnancy",
"water broke early", "cord prolapse",
"postpartum hemorrhage", "labor complications"
],

# Anaphylaxis / Severe Allergy
"anaphylaxis": [
"anaphylaxis", "anaphylactic shock", "throat swelling",
"tongue swelling", "severe allergic reaction",
"throat closing", "hives with breathing problem",
"bee sting reaction severe", "food allergy severe"
],

# Psychiatric Emergencies
"psychiatric_emergency": [
"suicidal", "want to die", "kill myself",
"self harm", "cutting myself", "attempted suicide",
"overdose on purpose", "psychosis acute",
"violent behavior", "harm others"
]
},

# ═══════════════════════════════════════
# 🟡 OPENROUTER — General, Chronic, Mental Health
# ═══════════════════════════════════════
"openrouter": {

# Common Illnesses (Beginner Level)
"common": [
"fever", "high temperature", "cold", "common cold",
"flu", "influenza", "cough", "runny nose",
"sore throat", "headache", "body ache", "fatigue",
"weakness", "tiredness", "nausea", "vomiting",
"diarrhea", "loose motion", "stomach ache",
"indigestion", "constipation", "bloating", "gas"
],

# Infectious Diseases
"infectious": [
"malaria", "typhoid", "dengue", "chikungunya",
"covid", "coronavirus", "tuberculosis", "tb",
"hepatitis", "jaundice", "yellow fever", "cholera",
"typhus", "leptospirosis", "brucellosis",
"viral infection", "bacterial infection", "fungal infection",
"worm infection", "parasite", "ringworm", "scabies"
],

# Respiratory Conditions
"respiratory": [
"asthma", "bronchitis", "pneumonia", "bronchial asthma",
"wheezing", "chronic cough", "copd", "emphysema",
"pleurisy", "lung infection", "chest infection",
"sinusitis", "nasal congestion", "post nasal drip"
],

# Cardiovascular (Non-Emergency)
"cardiovascular_general": [
"high blood pressure", "hypertension", "low blood pressure",
"hypotension", "cholesterol", "high cholesterol",
"varicose veins", "edema", "leg swelling",
"poor circulation", "anemia", "low hemoglobin"
],

# Digestive / GI Conditions
"digestive": [
"appendicitis", "gastritis", "ulcer", "peptic ulcer",
"acid reflux", "gerd", "ibs", "irritable bowel",
"crohn's disease", "colitis", "celiac disease",
"gallstones", "pancreatitis", "liver disease",
"fatty liver", "cirrhosis", "hernia", "hemorrhoids",
"piles", "anal fissure", "rectal bleeding"
],

# Endocrine / Hormonal
"endocrine": [
"diabetes", "sugar", "blood sugar high", "blood sugar low",
"hypoglycemia", "hyperglycemia", "thyroid", "hypothyroid",
"hyperthyroid", "goiter", "pcos", "polycystic ovary",
"adrenal", "cushing", "addison", "hormonal imbalance",
"insulin resistance", "metabolic syndrome"
],

# Neurological (Non-Emergency)
"neurological_general": [
"migraine", "chronic headache", "vertigo", "dizziness",
"tinnitus", "ringing ears", "numbness", "tingling",
"neuropathy", "nerve pain", "sciatica", "multiple sclerosis",
"parkinson", "alzheimer", "dementia", "memory loss",
"tremor", "bell's palsy", "carpal tunnel"
],

# Musculoskeletal
"musculoskeletal": [
"arthritis", "joint pain", "knee pain", "hip pain",
"back pain", "lower back pain", "neck pain",
"shoulder pain", "muscle pain", "fibromyalgia",
"gout", "osteoporosis", "spondylitis", "disc slip",
"disc herniation", "tendinitis", "bursitis",
"sprain", "strain", "muscle cramp"
],

# Skin Conditions
"skin": [
"rash", "skin rash", "itching", "hives", "eczema",
"psoriasis", "dermatitis", "acne", "pimples",
"boil", "abscess", "cellulitis", "impetigo",
"herpes", "chickenpox", "shingles", "vitiligo",
"hyperpigmentation", "skin darkening", "dandruff",
"hair loss", "alopecia", "nail infection"
],

# Eye Conditions (ENT)
"eyes_ent": [
"eye pain", "red eye", "conjunctivitis", "pink eye",
"eye infection", "blurry vision", "vision problem",
"glaucoma", "cataract", "dry eyes", "stye",
"ear pain", "ear infection", "otitis", "hearing loss",
"nose bleed", "epistaxis", "nasal polyp",
"tonsillitis", "laryngitis", "hoarseness"
],

# Urinary / Kidney
"urinary": [
"uti", "urinary tract infection", "burning urination",
"frequent urination", "kidney stone", "kidney infection",
"kidney disease", "renal failure", "blood in urine",
"dark urine", "cloudy urine", "urinary incontinence",
"overactive bladder", "prostate", "bph"
],

# Reproductive / Sexual Health
"reproductive": [
"std", "sti", "sexually transmitted", "discharge",
"vaginal infection", "yeast infection", "pelvic pain",
"endometriosis", "fibroids", "ovarian cyst",
"irregular periods", "menstrual pain", "heavy periods",
"infertility", "erectile dysfunction", "testicular pain",
"breast lump", "nipple discharge"
],

# Cancer & Tumors (General)
"oncology": [
"cancer", "tumor", "lump", "growth", "malignant",
"benign", "lymphoma", "leukemia", "breast cancer",
"lung cancer", "colon cancer", "prostate cancer",
"skin cancer", "melanoma", "cervical cancer",
"ovarian cancer", "unexplained weight loss",
"night sweats", "swollen lymph nodes"
],

# Pediatric General
"pediatric_general": [
"child fever", "baby fever", "teething", "colic",
"infant diarrhea", "child vomiting", "roseola",
"hand foot mouth", "measles", "mumps", "rubella",
"whooping cough", "child rash", "diaper rash",
"child growth", "child development", "vaccination"
],

# Geriatric
"geriatric": [
"elderly weakness", "fall elderly", "senior memory",
"osteoporosis elderly", "elderly confusion",
"senior incontinence", "elderly depression",
"age related", "elderly nutrition"
],

# ─── MENTAL HEALTH ───────────────────
"mental_health_general": [
"anxiety", "anxious", "panic attack", "panic",
"depression", "depressed", "feeling sad", "hopeless",
"stress", "stressed", "overwhelmed", "burnout",
"mood swings", "bipolar", "ocd", "obsessive",
"phobia", "fear", "social anxiety", "ptsd",
"trauma", "flashbacks", "insomnia", "sleep problem",
"can't sleep", "sleeping too much", "nightmares",
"eating disorder", "anorexia", "bulimia", "binge eating",
"adhd", "attention", "hyperactive", "autism",
"schizophrenia", "hallucination", "hearing voices",
"paranoia", "personality disorder", "dissociation",
"mental health", "emotional", "crying all the time",
"feeling empty", "no motivation", "low self esteem"
]
},

# ═══════════════════════════════════════
# 🟢 MISTRAL — Admin, Appointments, Quick
# ═══════════════════════════════════════
"mistral": {

# Appointments & Scheduling
"appointments": [
"book appointment", "schedule appointment",
"cancel appointment", "reschedule", "appointment available",
"next available slot", "book doctor", "see a doctor",
"book consultation", "make appointment",
"change appointment", "appointment reminder"
],

# Hospital Information
"hospital_info": [
"hospital hours", "clinic timing", "opening hours",
"doctor available", "which doctor", "specialist available",
"emergency contact", "hospital address", "location",
"directions", "how to reach", "phone number",
"consultation fee", "cost", "price", "charges",
"insurance accepted", "payment methods"
],

# General Greetings & Help
"general": [
"hello", "hi", "hey", "good morning", "good evening",
"help", "what can you do", "how does this work",
"thank you", "thanks", "ok", "okay", "bye", "goodbye",
"who are you", "what are you", "tell me about"
],

# Minor Symptoms (Quick Answer)
"minor": [
"mild headache", "slight fever", "minor cut",
"small bruise", "mild cold", "light cough",
"mild stomach upset", "slight nausea",
"minor skin irritation", "sunburn mild"
]
}
}

# ─────────────────────────────────────────────
# URGENCY LEVELS
# ─────────────────────────────────────────────

EMERGENCY_TRIGGERS = [
# Life threatening keywords
"dying", "going to die", "can't breathe", "cannot breathe",
"not breathing", "stopped breathing", "heart stopped",
"unconscious", "passed out", "unresponsive", "no pulse",
"severe chest pain", "stroke", "seizure now", "convulsing",
"overdose", "poisoned", "severe bleeding", "blood everywhere",
"suicidal", "want to kill myself", "help me please emergency",
"call ambulance", "anaphylaxis", "throat closing",
"baby not breathing", "child unconscious"
]

# ─────────────────────────────────────────────
# CORE ROUTING LOGIC
# ─────────────────────────────────────────────

def check_emergency(message: str) -> bool:
    """Check if message contains emergency keywords"""
    msg = message.lower()
    return any(trigger in msg for trigger in EMERGENCY_TRIGGERS)


def calculate_scores(message: str) -> dict:
    """Score each model based on keyword matches"""
    msg = message.lower()
    scores = {"groq": 0, "openrouter": 0, "mistral": 0}

    for model, categories in ROUTING_RULES.items():
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in msg:
                    # Longer keyword = more specific = higher score
                    scores[model] += len(keyword.split())

    return scores


def get_urgency_level(message: str, model: str) -> str:
    """Determine urgency level based on model and message"""
    msg = message.lower()

    if check_emergency(msg):
        return "🚨 EMERGENCY"
    elif model == "groq":
        return "🔴 HIGH"
    elif model == "openrouter":
        # Check for chronic vs acute
        chronic_words = ["chronic", "long term", "months", "years", "always"]
        if any(w in msg for w in chronic_words):
            return "🟡 MEDIUM"
        return "🟠 MODERATE"
    else:
        return "🟢 LOW"


def auto_route(user_message: str) -> dict:
    """
    Main routing function
    Returns: model_key, model_name, prompt, reason, urgency
    """

    # ── Step 1: Emergency override ──
    if check_emergency(user_message):
        return {
            "model_key": "groq",
            "model_name": MODELS["groq"],
            "prompt": SYSTEM_PROMPTS["groq"],
            "reason": "🚨 EMERGENCY detected — using deep reasoning model",
            "urgency": "🚨 EMERGENCY"
        }

    # ── Step 2: Score all models ──
    scores = calculate_scores(user_message)
    print(f"[Router Scores] Groq={scores['groq']} | OpenRouter={scores['openrouter']} | Mistral={scores['mistral']}")

    # ── Step 3: Pick winner ──
    chosen = max(scores, key=scores.get)

    # ── Step 4: Tie-breaking rules ──
    if scores[chosen] == 0:
        # No keywords matched → default to openrouter (medical)
        chosen = "openrouter"
        reason = "📋 No specific keywords — using medical default"
    elif scores["groq"] > 0 and scores["openrouter"] > 0:
        # Both medical models matched → Groq wins (safer)
        if scores["groq"] >= scores["openrouter"]:
            chosen = "groq"
            reason = f"🔴 Complex symptoms detected (score: {scores['groq']})"
        else:
            chosen = "openrouter"
            reason = f"🟡 General medical query (score: {scores['openrouter']})"
    else:
        reasons = {
            "groq": f"🔴 Emergency/critical symptoms detected (score: {scores['groq']})",
            "openrouter": f"🟡 Medical/health query matched (score: {scores['openrouter']})",
            "mistral": f"🟢 Admin/quick query matched (score: {scores['mistral']})"
        }
        reason = reasons[chosen]

    urgency = get_urgency_level(user_message, chosen)

    return {
        "model_key": chosen,
        "model_name": MODELS[chosen],
        "prompt": SYSTEM_PROMPTS[chosen],
        "reason": reason,
        "urgency": urgency
    }


import os
from groq import Groq
from openai import OpenAI
from mistralai import Mistral

# Load env directly inside since load_dotenv() is called in main.py, but just in case:
from dotenv import load_dotenv
load_dotenv()

# Initialize Clients
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

mistral_client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))

# ─────────────────────────────────────────────
# MAIN CHAT FUNCTION
# ─────────────────────────────────────────────

def chat(user_message: str, conversation_history: Optional[list] = None) -> dict:
    """
    Main chat function — routes and calls the correct Cloud API model
    Args:
        user_message: The user's input
        conversation_history: Previous messages for context
    Returns:
        dict with reply, model_used, urgency, reason
    """

    # Get routing decision
    route = auto_route(user_message)

    print(f"[Router] {route['reason']}")
    print(f"[Router] Target API: {route['model_name']}")
    print(f"[Router] Urgency: {route['urgency']}")

    # Build context from history
    history_text = ""
    if conversation_history:
        recent = conversation_history[-4:] # Last 4 messages for context
        for msg in recent:
            if isinstance(msg, dict):
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                history_text += f"{role.upper()}: {content}\n"
            else:
                 history_text += f"{msg}\n"

    # Build full prompt
    full_prompt = f"""{route['prompt']}

CONVERSATION HISTORY:
{history_text if history_text else "No previous messages."}

PATIENT MESSAGE: {user_message}

YOUR RESPONSE:"""

    reply = ""

    try:
        if route["model_key"] == "groq":
            # Uses GROQ (Llama 3.3 70B)
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.3,
                max_tokens=600,
            )
            reply = completion.choices[0].message.content.strip()
            actual_model = "Groq Llama-3.3-70B"

        elif route["model_key"] == "openrouter":
            # Uses OPENROUTER (Gemini 2.0 Flash)
            completion = openrouter_client.chat.completions.create(
                model=route["model_name"],
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.5,
                max_tokens=1500,
            )
            reply = completion.choices[0].message.content.strip()
            actual_model = "OpenRouter Gemini 2.0 Flash"
            
        elif route["model_key"] == "mistral":
            # Uses MISTRAL API
            completion = mistral_client.chat.complete(
                model="mistral-small-latest",
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.3,
                max_tokens=600,
            )
            reply = completion.choices[0].message.content.strip()
            actual_model = "Mistral Small"

        # ── Add emergency banner if needed ──
        if route["urgency"] == "🚨 EMERGENCY":
            reply = "🚨 CALL AN AMBULANCE OR GO TO ER IMMEDIATELY 🚨\n\n" + reply + \
                    "\n\n☎️ Emergency: 112 | Ambulance: 108"

        return {
            "reply": reply,
            "model_used": actual_model,
            "model_key": route["model_key"],
            "urgency": route["urgency"],
            "reason": route["reason"],
            "status": "success"
        }

    except Exception as e:
        print(f"[API ERROR] {str(e)}")
        return {
            "reply": f"⚠️ Cloud API Error: {str(e)}",
            "status": "error"
        }

# ─────────────────────────────────────────────
# TEST THE ROUTER
# ─────────────────────────────────────────────

if __name__ == "__main__":
    test_messages = [
        # Emergency
        "I have severe chest pain radiating to my left arm",
        "I can't breathe and my lips are turning blue",
        "I want to kill myself",

        # General Medical
        "I have fever headache and body ache since 2 days",
        "I think I have dengue, what are the symptoms",
        "I have been diagnosed with diabetes, what should I know",

        # Mental Health
        "I have been feeling very depressed and anxious lately",
        "I can't sleep at night and feel very stressed",

        # Chronic
        "My arthritis pain has been getting worse",
        "I have been having migraine for 3 years",

        # Admin
        "I want to book an appointment with a doctor",
        "What are your hospital hours?",
        "Hello, how does this work?"
    ]

    print("\n" + "="*60)
    print(" MediAI Router Test — All Disease Categories")
    print("="*60 + "\n")

    for msg in test_messages:
        route = auto_route(msg)
        print(f"📝 Input : {msg}")
        print(f"🤖 Model  : {route['model_key'].upper()} → {route['model_name']}")
        print(f"📊 Urgency: {route['urgency']}")
        print(f"💡 Reason : {route['reason']}")
        print("-" * 60)
