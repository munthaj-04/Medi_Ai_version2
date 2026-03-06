"use client";
import React, { useEffect, useState } from "react";
import Head from "next/head";

export default function ProviderDashboard() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [hospitalAuth, setHospitalAuth] = useState<string>("1");
    const [loading, setLoading] = useState(true);
    const [backendStatus, setBackendStatus] = useState<"online" | "offline">("online");

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://127.0.0.1:8000/api/appointments?hospital_id=${hospitalAuth}`);
            if (!res.ok) throw new Error("Offline");
            const data = await res.json();
            setAppointments(data.appointments || []);
            setBackendStatus("online");
        } catch (e) {
            console.error(e);
            setBackendStatus("offline");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
        // Poll every 10 seconds for real-time vibe
        const interval = setInterval(fetchAppointments, 10000);
        return () => clearInterval(interval);
    }, [hospitalAuth]);

    const s = {
        root: { background: "#020617", minHeight: "100vh", color: "#f8fafc", fontFamily: "sans-serif", padding: "24px 32px" },
        header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
        title: { fontSize: 22, fontWeight: 700, color: "#38bdf8" },
        select: { background: "#0f172a", border: "1px solid #1e293b", color: "#f8fafc", padding: "6px 14px", borderRadius: 8, outline: "none", fontSize: 13 },
        cardGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 },
        card: { background: "#0f172a", border: "1px solid #1e293b", padding: 18, borderRadius: 12 },
        cardVal: { fontSize: 28, fontWeight: 800, color: "#f8fafc", marginTop: 4 },
        cardLabel: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 },
        tableWrap: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" },
        table: { width: "100%", borderCollapse: "collapse" },
        th: { background: "#0b1120", padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 },
        td: { padding: "14px 16px", borderTop: "1px solid #1e293b", fontSize: 13 }
    };

    const emergencyCases = appointments.filter(a => a.pain_scale >= 4).length;
    const standardCases = appointments.filter(a => a.pain_scale > 0 && a.pain_scale < 4).length;
    const totalFees = standardCases * 50;

    return (
        <div style={s.root as any}>
            <Head>
                <title>Provider Triage Dashboard | MediAI</title>
            </Head>

            <div style={s.header as any}>
                <div>
                    <div style={s.title as any}>🏥 Provider Triage Dashboard</div>
                    <p style={{ color: "#94a3b8", marginTop: 4 }}>Real-time incoming emergency patient feed</p>
                </div>

                <select
                    style={s.select as any}
                    value={hospitalAuth}
                    onChange={(e) => setHospitalAuth(e.target.value)}
                >
                    <option value="1">Auth: Apollo Hospitals</option>
                    <option value="2">Auth: KIMS Hospitals</option>
                    <option value="3">Auth: Yashoda Hospitals</option>
                </select>
            </div>

            {backendStatus === "offline" && (
                <div style={{ background: "#450a0a", border: "1px solid #ef444455", color: "#fca5a5", padding: "12px 16px", borderRadius: 12, marginBottom: 24, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>⚠️</span>
                    <strong>Backend Offline:</strong> Run <code>python start.py</code> in the backend folder to sync data.
                </div>
            )}

            <div style={s.cardGrid as any}>
                <div style={s.card as any}>
                    <div style={s.cardLabel as any}>Standard Bookings (1-3)</div>
                    <div style={{ ...s.cardVal as any, color: "#38bdf8" }}>{standardCases}</div>
                </div>
                <div style={s.card as any}>
                    <div style={s.cardLabel as any}>Emergency Dispatch (4-5)</div>
                    <div style={{ ...s.cardVal as any, color: "#ef4444" }}>{emergencyCases}</div>
                </div>
                <div style={s.card as any}>
                    <div style={s.cardLabel as any}>Platform Revenue (Stripe)</div>
                    <div style={{ ...s.cardVal as any, color: "#10b981" }}>₹{totalFees}</div>
                </div>
            </div>

            <div style={s.tableWrap as any}>
                <table style={s.table as any}>
                    <thead>
                        <tr>
                            <th style={s.th as any}>Booking ID</th>
                            <th style={s.th as any}>Patient</th>
                            <th style={s.th as any}>Symptoms & AI Diagnosis</th>
                            <th style={s.th as any}>AI Specialist Rec</th>
                            <th style={s.th as any}>Severity</th>
                            <th style={s.th as any}>Assigned Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && appointments.length === 0 ? (
                            <tr><td colSpan={5} style={{ ...s.td as any, textAlign: "center", color: "#94a3b8" }}>Syncing hospital records...</td></tr>
                        ) : appointments.length === 0 ? (
                            <tr><td colSpan={5} style={{ ...s.td as any, textAlign: "center", color: "#94a3b8" }}>No incoming patients yet.</td></tr>
                        ) : appointments.map((appt) => (
                            <tr key={appt.id}>
                                <td style={s.td as any}>
                                    <span style={{ background: "#1e293b", padding: "4px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>{appt.booking_id}</span>
                                </td>
                                <td style={{ ...s.td as any, fontWeight: 600 }}>{appt.patient_name}</td>
                                <td style={s.td as any}>
                                    <div>{appt.symptoms}</div>
                                    <div style={{ fontSize: 12, color: "#38bdf8", marginTop: 4 }}>↳ {appt.diagnosis}</div>
                                </td>
                                <td style={s.td as any}>
                                    <div style={{ color: appt.pain_scale >= 4 ? "#fca5a5" : "#94a3b8", fontWeight: 700 }}>
                                        🩺 {appt.recommended_specialist || "General Physician"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Auto-assigned by AI</div>
                                </td>
                                <td style={s.td as any}>
                                    {appt.pain_scale >= 4 ? (
                                        <span style={{ color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                            <span className="status-dot status-pulse" style={{ background: "#ef4444" }} /> Critical ({appt.pain_scale}/5)
                                        </span>
                                    ) : (
                                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>Moderate ({appt.pain_scale}/5)</span>
                                    )}
                                </td>
                                <td style={{ ...s.td as any, color: "#10b981", fontWeight: 600 }}>{appt.appointment_time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
