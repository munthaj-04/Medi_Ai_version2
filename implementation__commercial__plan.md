# MediAI v2: Monetization Model Implementation Plan

This document outlines the detailed strategy and technical plan to upgrade MediAI to a revenue-generating platform ("Version 2").

## User Review Required
> [!IMPORTANT]
> Please review these business models. Which model(s) do you want us to prioritize for v2? Once you approve the direction, we can begin executing the technical changes.
> 1. **B2C (Patient-Paid)**: Convenience fees on bookings, premium subscriptions for unlimited chat.
> 2. **B2B (Hospital-Paid)**: Hospitals pay for patient leads/referrals.
> 3. **Affiliate (Third-Party)**: Revenue sharing with e-pharmacies and telemedicine providers.

## Proposed Monetization Models for v2

### 1. The Freemium B2C Model (Patient Facing)
* **Free Tier:** Basic multilingual symptom checking and standard triage logic.
* **Premium Features (MediAI Plus):**
  * **Convenience Fee for Booking:** A small fixed fee (e.g., ₹50-100) charged directly to the patient for bypassing the hospital waiting room and securing an emergency slot.
  * **Advanced Medical Reports:** Users pay a one-time micro-transaction to download a highly detailed, physician-ready PDF summary of their chat history and AI diagnosis.
  * **Unlimited Chat:** Cap the free tier at 10 messages to control API costs (Groq/Gemini). Charge a monthly subscription for unlimited chronic condition coaching and mental health chats.

### 2. The B2B Lead-Generation Model (Hospital Facing)
* **Referral Fees:** Hospitals pay a fixed fee for every verified patient routed to their Emergency Room or OPD via MediAI.
* **Hospital Dashboard Subscription (SaaS):** Provide hospitals with a real-time dashboard showing incoming patients, AI-generated pre-arrival reports, and predicted wait times. Charge a monthly SaaS license fee for clinics and hospitals to be listed on the platform.

### 3. Integrated Affiliate Revenue (Telehealth & Pharmacy)
* **Teleconsultation Handoff:** For Low/Moderate urgency cases, offer an instant video consultation with a human doctor. MediAI takes a 10-20% commission on the consultation fee.
* **E-Pharmacy Integration:** For non-critical issues where the AI suggests OTC management, provide integrated links (e.g., Apollo Pharmacy, 1mg) and earn affiliate revenue on digital cart checkouts.

---

## Proposed Technical Changes (Phase 1: B2C Monetization)

To implement the B2C Freemium and Booking Fee models, we need the following technical upgrades:

### Frontend (Next.js)
* **[NEW] `frontend/src/app/components/PaymentModal.tsx`**: A reusable UI component for Stripe/Razorpay checkouts (glassmorphism style).
* **[MODIFY] [frontend/src/app/booking/page.tsx](file:///c:/Users/LENOVO/3D%20Objects/Booking/frontend/src/app/booking/page.tsx)**: Inject a payment step before finalizing the appointment ID.
* **[MODIFY] [frontend/src/app/page.tsx](file:///c:/Users/LENOVO/3D%20Objects/Booking/frontend/src/app/page.tsx) (Chat Interface)**: Implement a message counter. If `msg_count > LIMIT`, trigger a paywall modal for "MediAI Plus".

### Backend (FastAPI)
* **[NEW] `backend/routers/payments.py`**: API endpoints to create Stripe/Razorpay payment sessions and handle webhooks.
* **[NEW] `backend/services/billing.py`**: Logic to track user message limits and active subscriptions.
* **[MODIFY] `backend/models/user.py`**: Add fields like `is_premium`, `message_count`, and `stripe_customer_id` into the SQLAlchemy models (or Supabase, if migrated).
* **[MODIFY] [backend/requirements.txt](file:///c:/Users/LENOVO/3D%20Objects/Booking/backend/requirements.txt)**: Add `stripe` or `razorpay` integration libraries.

## Verification Plan

### Automated Tests
* Create unit tests in the backend to ensure payment webhooks correctly upgrade user status to `is_premium = True`.
* Test the chat endpoint to ensure it returns a `403 Payment Required` status when a free user exceeds the message limit.

### Manual Verification
* Run the Next.js frontend and complete a test chat session.
* Verify the chat locks after the set limit and displays the premium paywall.
* Complete a test payment using the associated Sandbox mode and confirm the chat unlocks instantly.
* Go through the Emergency Booking flow and confirm the convenience fee is successfully charged before the final SMS receipt is sent.
