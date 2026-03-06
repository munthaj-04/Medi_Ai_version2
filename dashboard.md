# 🏥 MediAI Provider SaaS Dashboard

The Provider Dashboard is a **real-time B2B SaaS interface** built for hospital receptionists, triage nurses, and administrators. 

When a patient interacts with the MediAI Emergency bot and confirms a booking, their data (including AI diagnosis, urgency levels, and personal details) is instantly transmitted to this dashboard. 

## 🌟 Features
- **Live Syncing:** Real-time polling fetches incoming patients so nurses are ready before the patient even walks through the hospital doors.
- **AI Triage Prioritization:** Critical cases (Pain Scale 4 & 5) are highlighted with flashing red status indicators so staff immediately know who needs critical care vs. who can wait.
- **Hospital Siloing:** An authentication dropdown lets you simulate different hospital systems (e.g., Apollo vs KIMS). A hospital will *only* see patients routed to their specific branch.
- **Revenue Tracking:** Calculates expected immediate revenue based on the ₹50 priority-booking convenience fee logic.

---

## 💻 How to View the Dashboard
If your frontend and backend servers are running, follow these steps:

1. Open your browser.
2. Navigate to: [http://localhost:3000/provider](http://localhost:3000/provider)
3. Select your designated hospital from the Top-Right Dropdown.
4. Watch as incoming patient bookings from the main Chatbot interface appear live in your table!

*(If the table is empty, simply open `http://localhost:3000` in a new tab, run through the chat triage process, choose a hospital, click 'Pay ₹50', and watch the booking appear in the dashboard tab!)*
