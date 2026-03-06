# MediAI: Versioning and Features

## Version 1: The Foundation
**Overview:**
Version 1 of MediAI established the core triage and hospital booking flow. It provided a functional base for users to report symptoms and find nearby hospitals.

**Key Features:**
*   **AI Chat Triage:** Basic symptom collection and pain scale evaluation.
*   **Simple Hospital Listing:** Displayed a static list of nearby hospitals based on mock data.
*   **Slot Selection:** Allowed users to pick a time slot and a doctor from a static list.
*   **Basic Confirmation:** Concluded with a simple "Done" screen without real-world integrations.

---

## Version 2: The "Next-Level" Hackathon Upgrade
**Overview:**
Version 2 transforms the application from a basic prototype into an intelligent and interactive product ready for real-world deployment, with a strong focus on monetization and user experience.

**New Requirements & Features Added:**

1.  **Monetization & Freemium Model (B2C)**
    *   **Chat Paywall:** Implemented a 5-message free limit per session in the FastAPI backend, tracking usage via an SQLite database.
    *   **"MediAI Plus" Upgrade:** Dynamic frontend UI intercepting the paywall trigger to offer a premium subscription.
    *   **Stripe Integration:** Integrated Stripe checkout for a ₹50 "priority slot" convenience fee during emergency hospital bookings.

2.  **Smart AI Doctor Matching**
    *   Replaced generic doctor lists with specialty-specific data (e.g., Cardiologist, Neurologist).
    *   Implemented an algorithm that cross-references user symptoms with doctor specialties.
    *   Added a glowing "⭐ AI MATCH" badge to highly recommend specific doctors based on the patient's triage report.

3.  **Live Interactive Routing (Leaflet Maps)**
    *   Integrated `react-leaflet` to render interactive maps.
    *   Visualizes hospital locations and allows users to click map markers to instantly select a hospital for booking.

4.  **Accessibility & Voice Dictation**
    *   Integrated the Web Speech API directly into the Triage Chat.
    *   Added a microphone button allowing patients in severe pain to dictate their symptoms rather than typing.

5.  **Patient Data Portability (PDF Reports)**
    *   Integrated `jspdf` and `html2canvas`.
    *   Allows patients to instantly generate and download a professional clinical PDF report of their triage session and appointment details.

6.  **Real-World SMS Notifications (Twilio)**
    *   Integrated the Twilio Python SDK into the FastAPI backend.
    *   Configured endpoints to fire off real SMS confirmation receipts to the patient's phone number upon successful payment and booking.
