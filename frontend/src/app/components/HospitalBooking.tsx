"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

const hospitals = [
    {
        id: 1,
        name: "Apollo Hospitals",
        distance: "3.2 km",
        rating: 4.8,
        reviews: 2341,
        speciality: "Multi-Speciality",
        address: "Jubilee Hills, Hyderabad",
        wait: "~15 min",
        image: "🏥",
        slots: ["9:00 AM", "10:30 AM", "11:00 AM", "2:00 PM", "3:45 PM", "5:00 PM"],
        doctors: [
            { name: "Dr. Ramesh Sharma", specialty: "Cardiologist" },
            { name: "Dr. Priya Nair", specialty: "Neurologist" },
            { name: "Dr. Anil Kumar", specialty: "General Physician" }
        ],
        fee: "800",
        badge: "Top Rated",
        badgeColor: "#10b981",
        open: true,
    },
    {
        id: 2,
        name: "KIMS Hospital",
        distance: "5.1 km",
        rating: 4.5,
        reviews: 1892,
        speciality: "Super Speciality",
        address: "Secunderabad, Hyderabad",
        wait: "~25 min",
        image: "🏨",
        slots: ["9:30 AM", "11:30 AM", "1:00 PM", "3:00 PM", "4:30 PM"],
        doctors: [
            { name: "Dr. Suresh Reddy", specialty: "Orthopedic" },
            { name: "Dr. Kavitha Menon", specialty: "Cardiologist" }
        ],
        fee: "750",
        badge: "Nearest",
        badgeColor: "#3b82f6",
        open: true,
    },
    {
        id: 3,
        name: "Yashoda Hospital",
        distance: "6.8 km",
        rating: 4.6,
        reviews: 3105,
        speciality: "Multi-Speciality",
        address: "Somajiguda, Hyderabad",
        wait: "~10 min",
        image: "🏦",
        slots: ["10:00 AM", "12:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"],
        doctors: [
            { name: "Dr. Rajesh Gupta", specialty: "General Physician" },
            { name: "Dr. Meena Iyer", specialty: "Pediatrician" },
            { name: "Dr. Farhan Ali", specialty: "Neurologist" }
        ],
        fee: "600",
        badge: "Fastest",
        badgeColor: "#f59e0b",
        open: true,
    },
    {
        id: 4,
        name: "Care Hospitals",
        distance: "8.3 km",
        rating: 4.3,
        reviews: 1247,
        speciality: "General",
        address: "Banjara Hills, Hyderabad",
        wait: "~30 min",
        image: "🏢",
        slots: ["9:00 AM", "1:30 PM", "3:00 PM", "5:00 PM"],
        doctors: [
            { name: "Dr. Swati Patel", specialty: "General Surgeon" }
        ],
        fee: "500",
        badge: null,
        open: false,
    },
];

const STEPS = ["hospitals", "slots", "confirm", "payment", "done"];

export default function HospitalBooking() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState("hospitals");
    const [selectedHospital, setSelectedHospital] = useState<any>(null);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [patientName, setPatientName] = useState("");
    const [phone, setPhone] = useState("");
    const [filter, setFilter] = useState("all");

    const symptoms = searchParams.get("symptoms") || "Fever, Headache, Stiff Neck";
    const painScale = parseInt(searchParams.get("painScale") || "3", 10); // Default to 3 (Moderate) instead of 4 (Severe)

    const [bookingId, setBookingId] = useState("");

    const getRecommendedSpecialist = (symptomStr: string) => {
        const s = symptomStr.toLowerCase();
        if (s.includes("heart") || s.includes("chest pain") || s.includes("cardiac")) return "Cardiologist";
        if (s.includes("brain") || s.includes("headache") || s.includes("neurological") || s.includes("seizure")) return "Neurologist";
        if (s.includes("kidney") || s.includes("urine")) return "Nephrologist";
        if (s.includes("bone") || s.includes("fracture") || s.includes("joint")) return "Orthopedic";
        if (s.includes("child") || s.includes("baby") || s.includes("pediatric")) return "Pediatrician";
        if (s.includes("skin") || s.includes("rash")) return "Dermatologist";
        if (s.includes("stomach") || s.includes("abdominal") || s.includes("digestion")) return "Gastroenterologist";
        if (s.includes("breath") || s.includes("lung") || s.includes("asthma")) return "Pulmonologist";
        return "General Physician";
    };

    const recSpecialist = getRecommendedSpecialist(symptoms);

    useEffect(() => {
        setBookingId("MED-" + Math.random().toString(36).substr(2, 8).toUpperCase());
        if (searchParams.get("payment") === "success") {
            setStep("done");

            // Rehydrate state from URL after Stripe redirect
            const pDoctor = searchParams.get("doc");
            const pSlot = searchParams.get("slot");
            const pHospitalId = searchParams.get("hosp");
            const pName = searchParams.get("name");
            const pPhone = searchParams.get("phone");

            if (pDoctor) setSelectedDoctor(decodeURIComponent(pDoctor));
            if (pSlot) setSelectedSlot(decodeURIComponent(pSlot));
            if (pName) setPatientName(decodeURIComponent(pName));
            if (pPhone) setPhone(decodeURIComponent(pPhone));
            if (pHospitalId) {
                const h = hospitals.find(h => h.id.toString() === pHospitalId);
                if (h) {
                    setSelectedHospital(h);

                    // SAVE BOOKING TO DATABASE FOR SaaS DASHBOARD
                    fetch("http://127.0.0.1:8000/api/appointments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            hospital_id: h.id.toString(),
                            hospital_name: h.name,
                            patient_name: pName ? decodeURIComponent(pName) : "Unknown Patient",
                            time: pSlot ? decodeURIComponent(pSlot) : "TBD",
                            symptoms: symptoms,
                            diagnosis: "AI Auto-Triage Match",
                            pain_scale: painScale,
                            recommended_specialist: recSpecialist
                        })
                    }).then(res => res.json()).then(data => {
                        if (data.status === "success" || data.booking_id) {
                            const bId = data.booking_id || "Confirmed";
                            setBookingId(bId);

                            // Trigger the SMS Endpoint inside the success handler
                            fetch("http://127.0.0.1:8000/sms/send", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    phone: "+123456789",
                                    message: `MediAI Alert: Your ${painScale >= 4 ? 'EMERGENCY' : 'priority'} appointment is booked. Hospital: ${h.name}. Booking ID: ${bId}.`
                                })
                            }).catch(e => console.error("SMS Error:", e));
                        }
                    }).catch(console.error);
                }
            }
        }
    }, [searchParams]);

    const downloadPDF = async () => {
        const element = document.getElementById("patient-report");
        if (element) {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save("MediAI_Clinical_Report.pdf");
        }
    };

    const painLabels = ["None", "Minimal", "Mild", "Moderate", "Severe", "Critical"]; // Standard medical triage labels
    const painColors = ["#94a3b8", "#10b981", "#84cc16", "#f59e0b", "#ef4444", "#7c3aed"];

    const filteredHospitals =
        filter === "open" ? hospitals.filter((h) => h.open) : hospitals;

    // AI Doctor Matching Logic
    const getRecommendedDoctor = (hospital: any) => {
        const query = symptoms.toLowerCase();
        let targetSpecialty = "General Physician";

        if (query.match(/heart|chest|arm pain|palpitation|breath|stroke/i)) targetSpecialty = "Cardiologist";
        else if (query.match(/headache|numbness|dizzy|faint|seizure|paralysis/i)) targetSpecialty = "Neurologist";
        else if (query.match(/bone|joint|fracture|back|leg|knee|fall/i)) targetSpecialty = "Orthopedic";
        else if (query.match(/child|baby|infant|toddler/i)) targetSpecialty = "Pediatrician";
        else if (query.match(/abdomen|stomach|vomit|nausea/i)) targetSpecialty = "General Surgeon";

        const match = hospital.doctors.find((d: any) => d.specialty === targetSpecialty);
        return match ? match.name : hospital.doctors[0].name;
    };

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const s = styles;

    return (
        <div style={s.root as any}>
            <div style={s.bg as any} />

            {/* Header */}
            <header style={s.header as any}>
                <div style={s.headerInner as any}>
                    <div style={s.logo as any}>
                        <span style={{ fontSize: 26, color: "#06b6d4" }}>⚕</span>
                        <span style={s.logoText as any}>MediAI</span>
                    </div>
                    <div style={s.painBadge as any}>
                        <span style={{ color: painColors[painScale], fontWeight: 700 }}>● Pain {painScale}/5</span>
                        <span style={{ color: painColors[painScale], fontSize: 11, marginLeft: 6 }}>
                            {painLabels[painScale]?.toUpperCase()}
                        </span>
                    </div>
                </div>
            </header>

            {/* Stepper */}
            {painScale < 4 ? (
                <div style={s.stepperWrap as any}>
                    {["Find Hospital", "Choose Slot", "Confirm", "Done"].map((label, i) => {
                        const cur = STEPS.indexOf(step);
                        const active = cur >= i;
                        return (
                            <div key={label} style={{ display: "flex", alignItems: "center" }}>
                                <div style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: "50%",
                                        background: active ? "#06b6d4" : "#1e293b",
                                        border: `2px solid ${active ? "#06b6d4" : "#334155"}`,
                                        color: active ? "#fff" : "#475569",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700,
                                    }}>
                                        {active && cur > i ? "✓" : i + 1}
                                    </div>
                                    <span style={{ fontSize: 10, color: active ? "#e2e8f0" : "#475569", whiteSpace: "nowrap" }}>
                                        {label === "payment" ? "Payment" : label}
                                    </span>
                                </div>
                                {i < 3 && (
                                    <div style={{
                                        width: 40, height: 2, background: active && cur > i ? "#06b6d4" : "#1e293b",
                                        margin: "0 6px", marginBottom: 16,
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={s.stepperWrap as any}>
                    {["Find Nearest", "Emergency Dispatch", "Ambulance Routing"].map((label, i) => {
                        // Custom steeper map for emergency
                        let localStepIndex = 0;
                        if (step === "hospitals") localStepIndex = 0;
                        else if (step === "confirm") localStepIndex = 1;
                        else if (step === "done" || step === "ambulance") localStepIndex = 2;

                        const active = localStepIndex >= i;
                        return (
                            <div key={label} style={{ display: "flex", alignItems: "center" }}>
                                <div style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: "50%",
                                        background: active ? "#ef4444" : "#1e293b",
                                        border: `2px solid ${active ? "#ef4444" : "#334155"}`,
                                        color: active ? "#fff" : "#475569",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700,
                                    }}>
                                        {active && localStepIndex > i ? "✓" : i + 1}
                                    </div>
                                    <span style={{ fontSize: 10, color: active ? "#e2e8f0" : "#475569", whiteSpace: "nowrap" }}>
                                        {label}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div style={{
                                        width: 40, height: 2, background: active && localStepIndex > i ? "#ef4444" : "#1e293b",
                                        margin: "0 6px", marginBottom: 16,
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={s.container as any}>

                {/* Symptom Banner */}
                {step !== "done" && (
                    <div style={s.symptomBanner as any}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", letterSpacing: 2, marginBottom: 3 }}>
                                AI DETECTED SYMPTOMS
                            </div>
                            <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>{symptoms}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <div key={n} style={{
                                    width: 10, height: 10, borderRadius: "50%",
                                    background: n <= painScale ? painColors[painScale] : "#1e293b",
                                    transform: n === painScale ? "scale(1.4)" : "scale(1)",
                                    transition: "all 0.2s",
                                }} />
                            ))}
                            <span style={{ color: painColors[painScale], fontSize: 11, fontWeight: 700, marginLeft: 8 }}>
                                {painLabels[painScale]}
                            </span>
                        </div>
                    </div>
                )}

                {/* ── HOSPITALS ── */}
                {step === "hospitals" && (
                    <div>
                        <button onClick={() => window.location.href = "/"} style={{ ...s.backBtn as any, marginBottom: 16 }}>← Return to MediAI Chat</button>

                        <div style={{ height: "260px", marginBottom: "20px", borderRadius: 16, overflow: "hidden", border: "1px solid #1e293b", position: "relative" }}>
                            <MapComponent
                                hospitals={filteredHospitals}
                                selectedHospital={null}
                                onSelect={(h: any) => { setSelectedHospital(h); setStep("slots"); }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Nearby Hospitals</h2>
                                <p style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>📍 Hyderabad · {dateStr}</p>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                                {["all", "open"].map(f => (
                                    <button key={f} onClick={() => setFilter(f)} style={{
                                        padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                                        cursor: "pointer", transition: "all 0.2s",
                                        background: filter === f ? "#06b6d4" : "transparent",
                                        color: filter === f ? "#fff" : "#94a3b8",
                                        border: `1px solid ${filter === f ? "#06b6d4" : "#1e293b"}`,
                                    }}>
                                        {f === "all" ? "All" : "Open Now"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                            {filteredHospitals.map(h => (
                                <div key={h.id} onClick={() => {
                                    if (!h.open) return;
                                    setSelectedHospital(h);
                                    // Auto-route based on Pain Scale priority!
                                    if (painScale >= 4) {
                                        setStep("confirm"); // Skip slots, head right to emergency dispatch
                                    } else {
                                        setStep("slots");
                                    }
                                }}
                                    style={{
                                        background: "#0a0f1e", borderRadius: 12, padding: 14,
                                        cursor: h.open ? "pointer" : "not-allowed",
                                        position: "relative", overflow: "hidden",
                                        border: `1.5px solid ${selectedHospital?.id === h.id ? "#06b6d4" : "#1e293b"}`,
                                        opacity: h.open ? 1 : 0.55,
                                        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                                    }}>
                                    {h.badge && (
                                        <div style={{
                                            position: "absolute", top: 14, right: 14,
                                            padding: "3px 10px", borderRadius: 20, fontSize: 10,
                                            fontWeight: 700, color: "#fff", background: h.badgeColor,
                                        }}>{h.badge}</div>
                                    )}
                                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                                        <div style={{ fontSize: 28 }}>{h.image}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>{h.name}</div>
                                            <div style={{ color: "#06b6d4", fontSize: 11, fontWeight: 500, marginTop: 1 }}>{h.speciality}</div>
                                            <div style={{ color: "#64748b", fontSize: 11, marginTop: 1 }}>📍 {h.address}</div>
                                        </div>
                                        <div style={{ color: "#94a3b8", fontSize: 10 }}>{h.distance}</div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
                                        <span style={{ color: "#e2e8f0", fontSize: 12 }}>
                                            <span style={{ color: "#f59e0b" }}>★</span> {h.rating}
                                            <span style={{ color: "#64748b" }}> ({h.reviews.toLocaleString()})</span>
                                        </span>
                                        <span style={{ color: "#e2e8f0", fontSize: 12 }}>
                                            <span style={{ color: "#06b6d4" }}>⏱</span> {h.wait} wait
                                        </span>
                                        <span style={{ color: "#e2e8f0", fontSize: 12 }}>
                                            <span style={{ color: "#10b981" }}>🩺</span> {h.doctors.length} doctors
                                        </span>
                                        <span style={{ color: "#e2e8f0", fontSize: 12 }}>
                                            <span style={{ color: "#a855f7", fontWeight: 700 }}>₹</span> {h.fee} fee
                                        </span>
                                        <span style={{
                                            marginLeft: "auto", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                            background: h.open ? "#06300a" : "#300a0a",
                                            color: h.open ? "#4ade80" : "#f87171",
                                        }}>
                                            {h.open ? "● Open" : "● Closed"}
                                        </span>
                                    </div>

                                    <button style={{
                                        width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
                                        background: !h.open ? "#1e293b" : (painScale >= 4 ? "linear-gradient(135deg,#ef4444,#b91c1c)" : "linear-gradient(135deg,#06b6d4,#0284c7)"),
                                        color: "#fff", fontWeight: 700, fontSize: 13, cursor: h.open ? "pointer" : "not-allowed",
                                    }}>
                                        {!h.open ? "Unavailable" : (painScale >= 4 ? "Trigger Emergency Dispatch 🚨" : "Select & Book →")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── SLOTS ── */}
                {step === "slots" && selectedHospital && (
                    <div>
                        <button onClick={() => setStep("hospitals")} style={s.backBtn as any}>← Back</button>

                        <div style={{
                            background: "#0a0f1e", border: "1.5px solid #06b6d4",
                            borderRadius: 10, padding: "10px 14px",
                            display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
                        }}>
                            <span style={{ fontSize: 24 }}>{selectedHospital.image}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>{selectedHospital.name}</div>
                                <div style={{ color: "#64748b", fontSize: 11 }}>📍 {selectedHospital.address} · {selectedHospital.distance}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ color: "#f59e0b", fontSize: 12 }}>★ {selectedHospital.rating}</div>
                                <div style={{ color: "#64748b", fontSize: 10 }}>{selectedHospital.reviews.toLocaleString()} reviews</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>👨‍⚕️ Choose a Doctor</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {selectedHospital.doctors.map((d: any) => {
                                    const isRecommended = getRecommendedDoctor(selectedHospital) === d.name;
                                    return (
                                        <div key={d.name} onClick={() => setSelectedDoctor(d.name)} style={{
                                            display: "flex", alignItems: "center", gap: 14,
                                            padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                                            background: selectedDoctor === d.name ? "#0f2535" : "#0a0f1e",
                                            border: `1.5px solid ${selectedDoctor === d.name ? "#06b6d4" : "#1e293b"}`,
                                            position: "relative",
                                        }}>
                                            {isRecommended && (
                                                <div style={{
                                                    position: "absolute", top: -8, right: -8,
                                                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                                                    color: "#fff", fontSize: 9, fontWeight: 800,
                                                    padding: "3px 8px", borderRadius: 12,
                                                    boxShadow: "0 4px 10px rgba(245, 158, 11, 0.4)",
                                                    border: "1px solid #ffb347",
                                                    zIndex: 10
                                                }}>⭐ AI MATCH</div>
                                            )}
                                            <div style={{
                                                width: 38, height: 38, borderRadius: "50%",
                                                background: "linear-gradient(135deg,#06b6d4,#0284c7)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "#fff", fontWeight: 800, fontSize: 15,
                                            }}>
                                                {d.name.split(" ").slice(-1)[0][0]}
                                            </div>
                                            <div>
                                                <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
                                                    {d.name}
                                                </div>
                                                <div style={{ color: "#64748b", fontSize: 11 }}>
                                                    {d.specialty}
                                                    {isRecommended && <span style={{ color: "#f59e0b", marginLeft: 6, fontWeight: 600 }}>• Recommended by AI</span>}
                                                </div>
                                            </div>
                                            {selectedDoctor === d.name && <span style={{ marginLeft: "auto", color: "#06b6d4", fontWeight: 700 }}>✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>🕐 Available Slots — Today</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px,1fr))", gap: 8 }}>
                                {selectedHospital.slots.map((slot: any) => (
                                    <button key={slot} onClick={() => setSelectedSlot(slot)} style={{
                                        padding: "10px 8px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                                        cursor: "pointer", transition: "all 0.2s",
                                        background: selectedSlot === slot ? "linear-gradient(135deg,#06b6d4,#0284c7)" : "#0a0f1e",
                                        border: `1.5px solid ${selectedSlot === slot ? "#06b6d4" : "#1e293b"}`,
                                        color: selectedSlot === slot ? "#fff" : "#94a3b8",
                                    }}>{slot}</button>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => selectedSlot && selectedDoctor && setStep("confirm")} style={{
                            ...(s.primaryBtn as any),
                            opacity: selectedSlot && selectedDoctor ? 1 : 0.4,
                            cursor: selectedSlot && selectedDoctor ? "pointer" : "not-allowed",
                        }}>
                            Continue to Confirm →
                        </button>
                    </div>
                )}

                {/* ── CONFIRM ── */}
                {step === "confirm" && (
                    <div>
                        <button onClick={() => setStep(painScale >= 4 ? "hospitals" : "slots")} style={s.backBtn as any}>← Back</button>

                        {painScale >= 4 ? (
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ef4444", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                🚨 Emergency Dispatch <span style={{ fontSize: 13, background: "#7f1d1d", color: "#fca5a5", padding: "4px 8px", borderRadius: 6, opacity: 0.9 }}>PRIORITY 1</span>
                            </h2>
                        ) : (
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 14 }}>Confirm Your Booking</h2>
                        )}

                        <div style={{ background: "#0a0f1e", border: `1px solid ${painScale >= 4 ? "rgba(239,68,68,0.5)" : "#1e293b"}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
                            {painScale >= 4 && (
                                <div style={{ color: "#fca5a5", fontSize: 13, background: "rgba(239,68,68,0.1)", padding: 12, borderRadius: 8, marginBottom: 16, border: "1px dashed rgba(239,68,68,0.3)" }}>
                                    <strong style={{ color: "#ef4444" }}>CRITICAL ALERT:</strong> Do not proceed to the hospital on your own. Paramedics have been notified of {symptoms}. An ambulance from {selectedHospital?.name} will be dispatched immediately upon your confirmation.
                                </div>
                            )}

                            {[
                                ["🏥 Hospital", selectedHospital?.name],
                                ["📍 Address", selectedHospital?.address],
                                painScale < 4 ? ["👨‍⚕️ Doctor", selectedDoctor] : null,
                                ["📅 Date", `Today — ${dateStr}`],
                                painScale < 4 ? ["🕐 Time", selectedSlot] : ["🚑 Dispatch Request", "IMMEDIATE"],
                                ["🤒 Symptoms", symptoms],
                                ["⚠️ Pain Level", `${painScale}/5 — ${painLabels[painScale]}`],
                            ].filter(Boolean).map((item: any) => {
                                const [k, v] = item;
                                return (
                                    <div key={k} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "10px 0", borderBottom: "1px solid #0f172a", gap: 12,
                                    }}>
                                        <span style={{ color: "#64748b", fontSize: 12 }}>{k}</span>
                                        <span style={{
                                            color: (k === "🕐 Time" || k === "🚑 Dispatch Request") ? (painScale >= 4 ? "#ef4444" : "#06b6d4") : k === "⚠️ Pain Level" ? painColors[painScale] : "#e2e8f0",
                                            fontSize: 12, fontWeight: (k === "🕐 Time" || k === "⚠️ Pain Level" || k === "🚑 Dispatch Request") ? 700 : 400,
                                            textAlign: "right", marginLeft: "auto"
                                        }}>{v}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <input placeholder="Patient Name" value={patientName}
                                onChange={e => setPatientName(e.target.value)} style={s.input as any} />
                            <input placeholder="Emergency Contact Number" value={phone}
                                onChange={e => setPhone(e.target.value)} style={s.input as any} />
                        </div>

                        {painScale >= 4 ? (
                            <div style={{ ...s.noticeBox as any, background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                                🔔 <b>FEE WAIVED:</b> Standard priority booking fees are bypassed for Level 4/5 emergencies. Hospital will bill triage & transport fees separately.
                            </div>
                        ) : (
                            <div style={s.noticeBox as any}>
                                📲 Confirmation SMS will be sent to your number. Doctor will receive your full symptom report before you arrive.
                            </div>
                        )}

                        <button onClick={async () => {
                            if (patientName && phone) {
                                if (painScale >= 4) {
                                    try {
                                        // Auto-deploy Emergency Dispatch record to backend
                                        const res = await fetch("http://localhost:8000/api/appointments", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                hospital_id: selectedHospital?.id?.toString() || "",
                                                hospital_name: selectedHospital?.name || "Unknown",
                                                patient_name: patientName,
                                                time: "Immediate Dispatch",
                                                symptoms: symptoms,
                                                diagnosis: "AI Emergency Trigger",
                                                pain_scale: painScale,
                                                recommended_specialist: recSpecialist
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.booking_id) setBookingId(data.booking_id);
                                    } catch (err) {
                                        console.error("Failed to post emergency dispatch", err);
                                    }
                                    setStep("ambulance");
                                } else {
                                    setStep("payment");
                                }
                            }
                        }} style={{
                            ...(s.primaryBtn as any),
                            background: painScale >= 4 ? "linear-gradient(135deg,#ef4444,#b91c1c)" : "linear-gradient(135deg,#06b6d4,#0284c7)",
                            opacity: patientName && phone ? 1 : 0.4,
                            cursor: patientName && phone ? "pointer" : "not-allowed",
                        }}>
                            {painScale >= 4 ? "🚑 Dispatch Ambulance NOW" : "💳 Proceed to Payment (₹50)"}
                        </button>
                    </div>
                )}

                {/* ── PAYMENT ── */}
                {step === "payment" && (
                    <div style={{ textAlign: "center", paddingTop: 30 }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: "50%",
                            background: "linear-gradient(135deg,#06b6d4,#0284c7)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 24, color: "#fff", margin: "0 auto 14px",
                        }}>💳</div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 14 }}>Complete Payment</h2>
                        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 24 }}>A convenience fee of ₹50 is required to secure this priority slot.</p>

                        <button onClick={async () => {
                            try {
                                const qs = new URLSearchParams();
                                qs.set("doc", selectedDoctor || "");
                                qs.set("slot", selectedSlot || "");
                                qs.set("hosp", selectedHospital?.id?.toString() || "");
                                qs.set("name", patientName || "");
                                qs.set("phone", phone || "");

                                const res = await fetch("http://localhost:8000/payments/create-checkout-session", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        session_id: searchParams.get("session_id") || "BKG-SESSION",
                                        return_query: qs.toString()
                                    })
                                });
                                const data = await res.json();
                                if (data.url) window.location.href = data.url;
                            } catch (e) {
                                alert("Failed to initiate payment. Please try again.");
                            }
                        }} style={{ ...(s.primaryBtn as any) }}>
                            Pay ₹50 & Confirm Appointment
                        </button>
                        <button onClick={() => setStep("confirm")} style={{ ...s.backBtn as any, marginTop: 16 }}>← Cancel & Edit Details</button>
                    </div>
                )}

                {/* ── DONE ── */}
                {step === "done" && (
                    <div style={{ textAlign: "center", paddingTop: 10 }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: "50%",
                            background: "linear-gradient(135deg,#10b981,#059669)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 30, color: "#fff", margin: "0 auto 14px",
                        }}>✓</div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>Appointment Confirmed!</h1>
                        <p style={{ color: "#64748b", fontSize: 12, marginBottom: 20 }}>Your booking has been successfully placed.</p>

                        <div style={{ background: "#0a0f1e", border: "1.5px solid #1e293b", borderRadius: 12, padding: 18, marginBottom: 18, textAlign: "left" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <span style={{ color: "#64748b", fontSize: 10, letterSpacing: 1 }}>BOOKING ID</span>
                                <span style={{ color: "#06b6d4", fontWeight: 700, letterSpacing: 2, fontSize: 14 }}>{bookingId}</span>
                            </div>
                            <div style={{ height: 1, background: "#1e293b", marginBottom: 16 }} />
                            {[
                                ["🏥", selectedHospital?.name],
                                selectedDoctor ? ["👨‍⚕️", selectedDoctor] : null,
                                ["📅", `Today · ${selectedSlot || 'ER Dispatch'} @ ${selectedHospital?.name}`],
                                ["📍", selectedHospital?.address],
                            ].filter(Boolean).map((item: any) => {
                                const [icon, val] = item;
                                return (
                                    <div key={icon} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #0f172a" }}>
                                        <span style={{ color: "#64748b" }}>{icon}</span>
                                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>{val}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
                            {[
                                { icon: "📲", title: "SMS Sent to Patient", sub: phone },
                                { icon: "📋", title: "Report Sent to Triage", sub: "Priority Dispatch" },
                            ].map(item => (
                                <div key={item.title} style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    background: "#0a0f1e", border: "1px solid #1e293b",
                                    borderRadius: 12, padding: "12px 20px",
                                }}>
                                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                                    <div>
                                        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                                        <div style={{ color: "#64748b", fontSize: 11 }}>{item.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div id="patient-report" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, marginBottom: 20, textAlign: "left", fontFamily: "sans-serif", color: "#0f172a" }}>
                            <div style={{ color: "#0ea5e9", fontWeight: 800, marginBottom: 16, fontSize: 16, borderBottom: "2px solid #f1f5f9", paddingBottom: 10 }}>🏥 MediAI Clinical Report</div>
                            <div style={{ fontSize: 13, lineHeight: 2.2 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Patient Name:</strong> <span>{patientName || "Anonymous"}</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Phone Contact:</strong> <span>{phone || "Provided"}</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Reported Symptoms:</strong> <span>{symptoms}</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Assessed Severity:</strong> <span style={{ color: painColors[painScale] || "#ef4444", fontWeight: 800 }}>{painScale}/5 — {painLabels[painScale]}</span></div>
                                <div style={{ borderTop: "1px dashed #cbd5e1", margin: "14px 0" }} />
                                <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Assigned Doctor:</strong> <span>{selectedDoctor}</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Hospital Venue:</strong> <span>{selectedHospital?.name}</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Appointment Slot:</strong> <span>Today {selectedSlot}</span></div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={downloadPDF} style={{
                                width: "100%", padding: "14px 0", borderRadius: 12, border: "2px solid #3b82f6",
                                background: "rgba(59, 130, 246, 0.1)",
                                color: "#60a5fa", fontWeight: 800, fontSize: 14, cursor: "pointer", marginTop: 8,
                            }}>
                                ⬇ Download Report as PDF
                            </button>

                            <button onClick={() => window.location.href = "/"} style={{ ...(s.primaryBtn as any), background: "linear-gradient(135deg,#10b981,#059669)", whiteSpace: "nowrap", padding: "0 16px" }}>
                                Done & Return to Chat
                            </button>
                        </div>
                    </div>
                )}

                {/* ── AMBULANCE TRACKING (EMERGENCY ONLY) ── */}
                {step === "ambulance" && (
                    <div style={{ textAlign: "center", paddingTop: 10 }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: "50%",
                            background: "linear-gradient(135deg,#ef4444,#b91c1c)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 30, color: "#fff", margin: "0 auto 10px",
                        }}>🚑</div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ef4444", marginBottom: 6 }}>Ambulance Dispatched!</h1>
                        <p style={{ color: "#fca5a5", fontSize: 12, marginBottom: 20 }}>Stay calm. Help is on the way from {selectedHospital?.name}.</p>

                        <div style={{ background: "#0a0f1e", border: "1.5px solid #7f1d1d", borderRadius: 12, padding: 18, marginBottom: 18, textAlign: "left" }}>
                            <div style={{ borderBottom: "1px dashed #7f1d1d", paddingBottom: 12, marginBottom: 12 }}>
                                <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>⚠️ IMMEDIATE FIRST AID INSTRUCTIONS</div>
                                <ul style={{ color: "#e2e8f0", fontSize: 13, margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                                    <li>Keep the patient calm and comfortable.</li>
                                    <li>Do not give anything to eat or drink.</li>
                                    <li>If breathing stops, begin CPR immediately.</li>
                                    <li>Gather all current medications the patient is taking.</li>
                                </ul>
                            </div>

                            <div style={{ height: "180px", borderRadius: 12, overflow: "hidden", border: "1px solid #1e293b", position: "relative" }}>
                                {/* Note: Real ambulance tracking wrapper could overlay moving icon here. For now we reuse map focused on hospital */}
                                <MapComponent
                                    hospitals={[selectedHospital]}
                                    selectedHospital={selectedHospital}
                                    onSelect={() => { }}
                                />
                                <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, background: "rgba(15,23,42,0.9)", backdropFilter: "blur(4px)", padding: 12, borderRadius: 10, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #334155" }}>
                                    <div>
                                        <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700 }}>ESTIMATED ARRIVAL</div>
                                        <div style={{ color: "#4ade80", fontSize: 18, fontWeight: 800 }}>8 min (2.4 km)</div>
                                    </div>
                                    <div style={{ fontSize: 24, animation: "pulse 1s infinite" }}>🚑</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={downloadPDF} style={{
                                width: "100%", padding: "14px 0", borderRadius: 12, border: "2px solid #ef4444",
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "#fca5a5", fontWeight: 800, fontSize: 14, cursor: "pointer", marginTop: 8,
                            }}>
                                ⬇ Download Info Handover
                            </button>

                            <button onClick={() => window.location.href = "/"} style={{ ...(s.primaryBtn as any), background: "#1e293b", color: "#94a3b8", whiteSpace: "nowrap", padding: "0 16px" }}>
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    root: {
        height: "100%", overflowY: "auto", background: "#020817",
        fontFamily: "'DM Sans','Nunito',sans-serif", color: "#e2e8f0", position: "relative",
    },
    bg: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at 20% 10%,rgba(6,182,212,0.08) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(2,132,199,0.06) 0%,transparent 60%)",
        pointerEvents: "none",
    },
    header: {
        borderBottom: "1px solid #0f172a", background: "rgba(2,8,23,0.96)",
        backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100,
    },
    headerInner: {
        maxWidth: 900, margin: "0 auto", padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
    },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoText: { fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 },
    painBadge: {
        display: "flex", alignItems: "center",
        background: "#0f172a", border: "1px solid #1e293b",
        padding: "6px 14px", borderRadius: 20, fontSize: 13,
        marginLeft: "auto"
    },
    stepperWrap: {
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "18px 24px", maxWidth: 600, margin: "0 auto",
    },
    container: { maxWidth: 900, margin: "0 auto", padding: "0 16px 20px" },
    symptomBanner: {
        background: "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.02))",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 10, padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexWrap: "wrap", gap: 8,
    },
    backBtn: {
        background: "transparent", border: "1px solid #1e293b",
        color: "#94a3b8", padding: "6px 12px", borderRadius: 8,
        cursor: "pointer", fontSize: 12, marginBottom: 14,
    },
    primaryBtn: {
        width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
        background: "linear-gradient(135deg,#06b6d4,#0284c7)",
        color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginTop: 8,
    },
    input: {
        width: "100%", padding: "12px 16px",
        background: "#0a0f1e", border: "1px solid #1e293b",
        borderRadius: 10, color: "#e2e8f0", fontSize: 14,
        marginBottom: 12, outline: "none", boxSizing: "border-box",
    },
    noticeBox: {
        background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)",
        borderRadius: 10, padding: "12px 16px",
        color: "#94a3b8", fontSize: 12, lineHeight: 1.6, marginBottom: 20,
    },
};

