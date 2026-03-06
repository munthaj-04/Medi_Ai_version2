"use client";

import { useState } from "react";
import ChatInterface from "@/app/components/ChatInterface";
import HospitalBooking from "@/app/components/HospitalBooking";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [painScale, setPainScale] = useState<number>(0);
  const [actions, setActions] = useState<any[]>([]);

  const hospitals = actions.find(a => a.tool === "find_nearest_hospital")?.result?.results || [];
  const radius = actions.find(a => a.tool === "find_nearest_hospital")?.result?.radius_km || 50;
  const availabilityData = actions.find(a => a.tool === "check_availability")?.result;
  const bookingData = actions.find(a => a.tool === "book_appointment")?.result;
  const reportData = actions.find(a => a.tool === "generate_doctor_report")?.result;

  const isEmergency = painScale >= 4;

  return (
    <main className="min-h-screen bg-black text-slate-100 flex flex-col font-sans relative">

      {/* ── Ambient Background Orbs ───────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] bg-blue-700/8 blur-[140px] rounded-full animate-float" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-700/8 blur-[160px] rounded-full animate-float" style={{ animationDelay: "3s" }} />
        {isEmergency && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-[30%] left-[30%] w-[500px] h-[500px] bg-red-700/6 blur-[120px] rounded-full animate-pulse-glow"
          />
        )}
      </div>

      {/* ── Top Nav Bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/[0.04] bg-black/80 backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          {/* Logo mark */}
          <div className="relative w-11 h-11">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path d="M12 4v16M4 12h16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-[18px] font-black bg-gradient-to-r from-white via-blue-100 to-slate-300 bg-clip-text text-transparent tracking-tight leading-none">
              MediAI
            </h1>
            <p className="text-[10px] text-blue-400/80 font-semibold uppercase tracking-[0.15em] mt-0.5">
              Emergency Triage · Multilingual
            </p>
          </div>
        </div>

        {/* Center — status pills */}
        <div className="hidden md:flex items-center gap-2">
          {[
            { label: "DeepSeek AI", dot: "bg-green-400" },
            { label: "RAG Active", dot: "bg-blue-400" },
            { label: "EN · हि · తె", dot: "bg-purple-400" },
          ].map(({ label, dot }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-[11px] text-slate-400 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${dot} opacity-80`} />
              {label}
            </div>
          ))}
        </div>

        {/* Right — urgency indicator */}
        <AnimatePresence>
          {painScale > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold border shadow-lg ${isEmergency
                ? "bg-red-500/10 text-red-400 border-red-500/25 shadow-red-500/10"
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/25"
                }`}
            >
              {isEmergency && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              )}
              <span>PAIN {painScale}/5</span>
              <span className="opacity-60">·</span>
              <span>{isEmergency ? "CRITICAL" : "MODERATE"}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content Area ──────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 p-5">
        <AnimatePresence mode="wait">
          <motion.section
            key="chat"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex-1 flex flex-col rounded-3xl border border-white/[0.06] relative max-w-5xl mx-auto w-full shadow-2xl mb-24"
            style={{
              background: "linear-gradient(145deg, rgba(10,10,10,0.95) 0%, rgba(5,5,15,0.98) 100%)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <ChatInterface
              messages={messages}
              setMessages={setMessages}
              setPainScale={setPainScale}
              setActions={setActions}
            />
          </motion.section>
        </AnimatePresence>
      </div>
    </main>
  );
}
