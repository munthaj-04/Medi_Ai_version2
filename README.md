# ⚕️ MediAI — Intelligent Emergency Triage & Hospital Routing System

**MediAI** is an advanced, multilingual AI medical triage assistant built designed to revolutionize the way patients interact with healthcare systems during emergencies. It intelligently routes patient queries to specialized Cloud AIs, calculates clinical urgency, and seamlessly transitions critical cases into a location-aware hospital booking flow.

---

## 🚀 Key Features

### 1. 🧠 Multi-Agent Cloud AI Routing
Unlike traditional chatbots that rely on a single model, MediAI features a custom **Auto-Router** that dynamically evaluates user symptoms against a comprehensive medical database to determine the most qualified AI model for the job:
- **Groq + Llama 3.3 70B**: Engaged instantly for **Emergency & Critical Care** (e.g., heart attacks, strokes, severe trauma).
- **OpenRouter + Gemini 2.0 Flash**: Handles **General Medical, Chronic, and Mental Health** queries with high empathy and accuracy.
- **Mistral 7B**: Resolves **Administrative & Quick Queries** (e.g., hospital hours, booking modifications).

### 2. 🚨 Automated Severity & Pain Scoring
MediAI utilizes clinical NLP to detect life-threatening keywords and assign an **Urgency Level** (Low, Moderate, High, Emergency). Simultaneously, it extracts a standard **Pain Scale (1-5)**.
- If a Pain Scale is absent, the AI proactively asks the user to rate their pain.
- Pain scales of **4/5 (SEVERE)** or **5/5 (CRITICAL)** act as system red flags, triggering an immediate safeguard override.

### 3. 🏥 Emergency Hospital Booking & Redirection
When a severe pain score or emergency is detected:
- The chat interface actively steps in, pausing standard text flow to offer immediate medical intervention.
- Upon user confirmation, MediAI extracts the user's symptoms and seamlessly opens the **Hospital Booking Interface**.
- The system automatically filters for open, nearby hospitals and calculates consultation fees in local currency (₹ INR).
- **Automated Reporting**: Once a slot is booked, the system simulates sending an SMS to the patient and generating a clinical report for the receiving doctor before the patient even arrives.

### 4. 🌐 Multilingual Accessibility
Built with inclusivity in mind, MediAI detects and responds in the patient's native language. It fully supports **English, Hindi (हिंदी), and Telugu (తెలుగు)**, ensuring that language barriers never delay emergency care.

### 5. ✨ Premium "Glassmorphism" UI State
The frontend is designed to feel like a premium, life-saving medical tool.
- Real-time **ECG line animations** and live status indicators.
- Smooth **Framer Motion** transitions and glowing active states.
- Clean, Apple-inspired glassmorphism with dynamic typing logic.

---

## ⚙️ How It Works (The Architecture in Action)

Here is exactly what happens from the moment a user types a message to the moment they get an appointment:

1. **User Input:** A user types their symptoms in the Next.js frontend (e.g., "I have severe chest pain and it's spreading to my left arm").
2. **Backend Interception & Scoring:** The message hits the FastAPI `/chat` endpoint. The text is immediately scanned by the `calculate_urgency_score()` function.
   - It looks for keywords like "chest pain", "heart attack", "stroke".
   - It assigns an Urgency Score: *Emergency/Critical*.
3. **Dynamic Routing:** Because the score is high, our custom AI Router bypasses the standard general-purpose models. It instantly targets **Groq + Llama 3** for ultra-fast, highly accurate medical reasoning.
4. **Pain Scale Extraction:** If the user hasn't explicitly mentioned a "1 to 5" pain number, the AI is prompted to extract what severity it feels like contextually, returning a structured JSON response (e.g., `{"reply": "...", "pain_scale": 5}`).
5. **Frontend Safeguard Override:** The frontend parses the response JSON. It sees `pain_scale: 5`. Instead of merely giving chat advice, the UI actively halts the conversation.
   - A pulsing red **EMERGENCY DETECTED** banner drops down.
   - The UI appends a hardcoded safety message: *"⚠️ Would you like me to book an emergency appointment at a nearby hospital?"*
6. **Confirmation & Redirection:** The moment the user types "Yes" or "Book", the chat UI extracts the symptom history and pain level, encodes it into the URL, and instantly initiates a NextJS router push to `/booking`.
7. **Hospital Mapping:** The `/booking` page mounts. It calculates nearby hospitals, filters out closed hospitals, and highlights available Emergency Rooms.
8. **Finalizing the Slot:** The user selects a doctor, time slot, and confirms. The system assigns a real Booking ID and generates a simulated SMS receipt for the patient, alongside an AI Medical Report dispatched instantly to the Doctor.
   
*(Data flows from User ➡️ NLP Server ➡️ Groq Cloud API Engine ➡️ Fast API Backend ➡️ Next.js React UI ➡️ Booking Interface).*

---

## 🛠️ Technology Stack

**Frontend:**
- Next.js (React)
- TailwindCSS & Vanilla CSS Variables
- Framer Motion (for fluid animations)
- Lucide React (Iconography)

**Backend:**
- Python & FastAPI 
- SQLite & SQLAlchemy (Database / Appointment Persistence)
- Python DOTENV (Environment Management)

**AI & APIs:**
- Groq Cloud API
- OpenRouter API
- Mistral API

---

## 💻 Running the Project Locally

### 1. Setup the Backend
Navigate to the backend directory, create a virtual environment, and install dependencies:

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder and add your API keys (get these from the platform dashboards):
```env
STRIPE_SECRET_KEY=sk_test_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
GROQ_API_KEY=gsk_...
```

Start the FastAPI server:
```bash
python start.py
```
*(The server will run on `http://localhost:8000`)*

### 2. Setup the Frontend
Open a new terminal, navigate to the frontend directory, install dependencies, and start the Next.js dev server:
```bash
cd frontend
npm install
npm run dev
```
*(The UI will run on `http://localhost:3000`)*

---

## 🏆 Hackathon Value Proposition & Monetization
MediAI bridges the gap between conversational AI and actionable medical routing. By intercepting critical physical symptoms and automating the hospital intake process, MediAI limits the time a patient spends waiting during the "golden hour" of a medical emergency.

### Dual Revenue Model (The B2C + B2B Strategy)
1. **B2C (Patient Side):** A freemium chatbot model. Users get 5 free deep-diagnosis messages before needing a "MediAI Plus" subscription. For emergencies, the app charges a ₹50 convenience fee at the Stripe checkout step to secure a priority hospital slot.
2. **B2B (Hospital Side):** The **Provider SaaS Dashboard**. Hospitals pay a monthly licensing fee to log into `http://localhost:3000/provider` and receive real-time, AI-prioritized intake feeds of incoming patients, letting them prepare trauma bays *before* the patient arrives. 

*(Check out [dashboard.md](./dashboard.md) or visit `/provider` to see the live hospital intake UI).*
