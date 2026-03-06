"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, AlertTriangle, Bot, User, Globe, Heart, Zap, Shield, Stethoscope, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Urgency config ────────────────────────────────── */
const SEVERITY: Record<number, { label: string; color: string; ring: string; glow: string }> = {
    5: { label: "CRITICAL", color: "text-red-400", ring: "border-red-500/40", glow: "shadow-red-500/20" },
    4: { label: "HIGH", color: "text-orange-400", ring: "border-orange-500/40", glow: "shadow-orange-500/20" },
    3: { label: "MODERATE", color: "text-yellow-400", ring: "border-yellow-500/40", glow: "shadow-yellow-500/20" },
    2: { label: "LOW", color: "text-green-400", ring: "border-green-500/40", glow: "shadow-green-500/20" },
    1: { label: "MILD", color: "text-blue-400", ring: "border-blue-500/40", glow: "shadow-blue-500/20" },
};

/* ── Quick prompts ─────────────────────────────────── */
const PROMPTS = [
    { icon: "🫀", text: "I have chest pain and left arm pain" },
    { icon: "🧠", text: "Severe headache, stiff neck, and high fever" },
    { icon: "👶", text: "My 3-year-old has high fever and a body rash" },
    { icon: "🤢", text: "Severe abdominal pain, lower right side" },
    { icon: "😮‍💨", text: "I can't breathe properly and feel dizzy" },
    { icon: "🦴", text: "Sharp lower back pain radiating to my leg" },
];

/* ── ECG SVG animation ─────────────────────────────── */
function ECGLine() {
    return (
        <svg viewBox="0 0 280 50" className="w-full h-10 opacity-40" fill="none">
            <polyline
                points="0,25 30,25 40,10 50,40 60,5 70,45 80,25 110,25 120,20 130,28 280,28"
                stroke="url(#ecgGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ecg-line"
            />
            <defs>
                <linearGradient id="ecgGrad" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                    <stop offset="40%" stopColor="#06b6d4" />
                    <stop offset="70%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
}

/* ── Thinking dots ─────────────────────────────────── */
function ThinkingDots() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex justify-start"
        >
            <div className="flex gap-3 items-end max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                    <Stethoscope size={14} className="text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md glass-card neon-border flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium tracking-widest uppercase mr-1">Analyzing</span>
                    {[0, 0.18, 0.36].map((d, i) => (
                        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.8, delay: d, repeat: Infinity }} />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

/* ── PainBadge ─────────────────────────────────────── */
function PainBadge({ scale }: { scale: number }) {
    const s = SEVERITY[scale];
    if (!s) return null;
    return (
        <motion.span initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.ring} ${s.color} bg-black/40`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${scale >= 3 ? 'animate-pulse' : ''}`} />
            PAIN {scale}/5 · {s.label}
        </motion.span>
    );
}

/* ── Manual Pain Selector ─────────────────────────── */
function ManualPainSelector({ onSelect, selected }: { onSelect: (val: number) => void, selected: number }) {
    return (
        <div className="flex flex-col gap-3 my-4 p-5 glass-card neon-border rounded-2xl max-w-sm">
            <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-blue-400" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select your pain level</span>
            </div>
            <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map((val) => {
                    const s = SEVERITY[val];
                    const isSelected = selected === val;
                    return (
                        <button
                            key={val}
                            onClick={() => onSelect(val)}
                            className={`flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-xl border transition-all ${isSelected
                                ? `${s.ring} bg-white/[0.08] scale-105 shadow-lg ${s.glow}`
                                : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05]"
                                }`}
                        >
                            <span className={`text-sm font-bold ${isSelected ? s.color : 'text-slate-500'}`}>{val}</span>
                            <span className="text-[8px] text-slate-600 uppercase font-black">{s.label.slice(0, 3)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ── Main Component ──────────────────────────────────── */
export default function ChatInterface({ messages, setMessages, setPainScale, setActions }: any) {
    const router = useRouter();
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamText, setStreamText] = useState("");
    const [hasError, setHasError] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [livePain, setLivePain] = useState(0);
    const [pendingPain, setPendingPain] = useState(0);
    const [showPainSelector, setShowPainSelector] = useState(false);
    const [hasSelectedScale, setHasSelectedScale] = useState(false);
    const [lastUrgency, setLastUrgency] = useState<string>("🟢 LOW");

    // Auto-scroll to bottom on new messages (using native window scroll)
    useEffect(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, [messages, streamText]);
    const offeredBookingRef = useRef(false);
    const [connected, setConnected] = useState(true);
    const [sessionId] = useState(() => "sess_" + Math.random().toString(36).substr(2, 9));
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading, streamText]);

    const handleSend = useCallback(async (override?: string) => {
        const text = (override ?? input).trim();
        if (!text || isLoading) return;
        const newMsgs = [...messages, { role: "user", content: text }];
        setMessages(newMsgs);
        setInput("");
        setIsListening(false);
        setHasError(false);
        setIsLoading(true);
        setStreamText("");

        try {
            const res = await fetch("http://127.0.0.1:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMsgs, patient_name: "Patient", session_id: sessionId }),
                signal: AbortSignal.timeout(60000),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const reply = data.reply || "I couldn't process your request. Please try again.";

            let finalReply = reply;
            let triggerBooking = false;
            let bookingPain = 0;

            const userSaidYes = offeredBookingRef.current && (text.toLowerCase().match(/\b(yes|yea|yeah|yep|yup|ok|okay|sure|book|please|do it)\b/));
            const userInitiatedBooking = text.toLowerCase().includes("book") || reply.toLowerCase().includes("book an appointment");

            if (userSaidYes || userInitiatedBooking) {
                if (!hasSelectedScale) {
                    setShowPainSelector(true);
                    setPendingPain(data.pain_scale > 0 ? data.pain_scale : 3);
                    finalReply = "Before matching you with a specialist, please select your current pain level (1-5) for accurate triage:";
                    offeredBookingRef.current = false;
                } else {
                    triggerBooking = true;
                    bookingPain = livePain || pendingPain || 0;
                    finalReply = "Opening hospital booking interface in a new tab...";
                    offeredBookingRef.current = false;
                }
            } else if ((data.pain_scale > 0 || (data.urgency && data.urgency !== "🟢 LOW")) && !hasSelectedScale) {
                setShowPainSelector(true);
                setPendingPain(data.pain_scale > 0 ? data.pain_scale : 3);
            } else if (data.pain_scale > 0) {
                setLivePain(data.pain_scale);
                setPainScale(data.pain_scale);
            }

            if (data.urgency) setLastUrgency(data.urgency);

            // Set reply instantly instead of building it artificially
            setIsLoading(false);
            setMessages([...newMsgs, { role: "assistant", content: finalReply }]);

            if (triggerBooking) {
                const symptomStr = encodeURIComponent(newMsgs.filter((m: any) => m.role === 'user').map((m: any) => m.content).join(" | "));
                router.push(`/booking?painScale=${bookingPain}&symptoms=${symptomStr}`);
            }

            if (data.actions?.length) setActions(data.actions);
            setConnected(true);
        } catch {
            setIsLoading(false);
            setStreamText("");
            setMessages([...newMsgs, {
                role: "assistant",
                content: "⚠️ Cannot reach MediAI server.\n\nPlease run:\n```\npython start.py\n```\nin the backend folder, then try again."
            }]);
            setConnected(false);
        }
    }, [input, isLoading, messages, setMessages, setPainScale, setActions, sessionId, pendingPain, hasSelectedScale, showPainSelector, livePain, lastUrgency]);

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice input is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join("");
            setInput(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const isEmpty = messages.length === 0 && !streamText;

    return (
        <div className="flex flex-col relative w-full">

            {/* ── Disconnected Banner ── */}
            <AnimatePresence>
                {!connected && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        className="bg-red-950/60 border-b border-red-500/20 text-red-400 text-xs px-4 py-2 flex items-center gap-2 overflow-hidden">
                        <span className="status-dot status-offline flex-shrink-0" />
                        Backend offline — run <code className="bg-black/40 px-2 py-0.5 rounded ml-1">python start.py</code>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Message Area ── */}
            <div
                className="flex-1 px-5 py-10 space-y-8"
            >

                {/* Welcome Screen */}
                {isEmpty && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center min-h-full gap-8 pb-10">

                        {/* Animated logo */}
                        <div className="relative mt-4">
                            <div className="absolute -inset-5 rounded-full bg-blue-500/10 blur-2xl" />
                            <div className="absolute -inset-3 rounded-full border border-blue-500/10 animate-ping opacity-30" style={{ animationDuration: '3s' }} />
                            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-blue-500/25 flex items-center justify-center shadow-2xl shadow-blue-500/15">
                                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                                    <circle cx="20" cy="20" r="17" stroke="url(#g1)" strokeWidth="1.5" />
                                    <path d="M12 20h4l2-7 4 14 3-10 2 3h3" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <defs>
                                        <linearGradient id="g1" x1="3" y1="3" x2="37" y2="37" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#3b82f6" /><stop offset="1" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>

                        {/* ECG animation strip */}
                        <div className="w-48"><ECGLine /></div>

                        <div className="text-center space-y-1.5">
                            <h2 className="text-[28px] font-black shimmer-text tracking-tight">MediAI</h2>
                            <p className="text-slate-400 font-semibold text-[15px]">Emergency Triage Assistant</p>
                            <p className="text-slate-600 text-xs">Emergency Medicine · Pediatrics · Internal Medicine</p>
                        </div>

                        {/* Language badges */}
                        <div className="flex gap-2 flex-wrap justify-center">
                            {[
                                { flag: "🇺🇸", name: "English", cls: "border-blue-500/20 text-blue-400 bg-blue-500/5" },
                                { flag: "🇮🇳", name: "हिंदी", cls: "border-orange-500/20 text-orange-400 bg-orange-500/5" },
                                { flag: "🔤", name: "తెలుగు", cls: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" },
                            ].map(({ flag, name, cls }) => (
                                <span key={name} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-medium ${cls}`}>
                                    {flag} {name}
                                </span>
                            ))}
                        </div>

                        {/* Quick prompts */}
                        <div className="w-full max-w-md space-y-2">
                            <p className="text-center text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium">Tap to try</p>
                            <div className="grid grid-cols-2 gap-2">
                                {PROMPTS.map(({ icon, text }, i) => (
                                    <motion.button key={i}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        whileHover={{ scale: 1.02, y: -1 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSend(text)}
                                        className="text-left px-3 py-2.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.055] border border-white/[0.05] hover:border-blue-500/20 text-slate-400 hover:text-slate-200 text-xs transition-all duration-200 flex items-start gap-2">
                                        <span className="text-base leading-none mt-0.5 flex-shrink-0">{icon}</span>
                                        <span className="leading-snug">{text}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Message Bubbles */}
                <AnimatePresence initial={false}>
                    {messages.map((m: any, i: number) => {
                        const isUser = m.role === "user";
                        const isPaywall = m.content?.includes("[PAYWALL_TRIGGERED]");
                        const content = m.content?.replace("[PAYWALL_TRIGGERED]", "").trim();
                        const painMatch = m.content?.match(/PAIN\s*SCALE:\s*(\d)/i);
                        const pain = painMatch ? parseInt(painMatch[1]) : 0;

                        // Paywall Rendering
                        if (isPaywall) {
                            return (
                                <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center my-4">
                                    <div className="bg-gradient-to-br from-[#0f172a] to-[#020817] p-6 rounded-2xl border border-blue-500/30 max-w-sm w-full shadow-2xl shadow-blue-500/10 relative overflow-hidden text-center">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
                                        <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                            <Shield size={24} className="text-blue-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">Upgrade to MediAI Plus</h3>
                                        <p className="text-[13px] text-slate-400 leading-relaxed mb-6">
                                            {content || "You've reached your free message limit. Get unlimited consultations, PDF reports, and priority routing."}
                                        </p>
                                        <div className="space-y-3">
                                            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-[0.98] transition-all">
                                                Upgrade Now (₹499/mo)
                                            </button>
                                            <button onClick={() => router.push(`/booking?painScale=${livePain || 0}&symptoms=Limit Reached`)} className="w-full py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300 font-bold text-sm hover:bg-white/[0.06] active:scale-[0.98] transition-all">
                                                Book Emergency Doctor
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                <div className={`flex gap-2.5 max-w-[86%] ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>

                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isUser ? "bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-purple-500/25"
                                        : "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25"
                                        }`}>
                                        {isUser
                                            ? <User size={14} className="text-white" />
                                            : <Stethoscope size={14} className="text-white" />}
                                    </div>

                                    {/* Bubble */}
                                    <div className="flex flex-col">
                                        <div className={`px-4 py-3 text-[13.5px] leading-relaxed shadow-xl ${isUser
                                            ? "bg-gradient-to-br from-violet-600/90 to-purple-800/80 text-white border border-white/[0.08] rounded-2xl rounded-tr-sm"
                                            : "glass-card text-slate-100 rounded-2xl rounded-tl-sm ai-message whitespace-pre-wrap"
                                            }`}>
                                            {content}
                                        </div>
                                        {!isUser && pain > 0 && hasSelectedScale && <PainBadge scale={pain} />}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Manual Triage Step */}
                {showPainSelector && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="flex flex-col gap-2.5 max-w-[86%] items-start ml-10">
                            <ManualPainSelector
                                selected={livePain}
                                onSelect={(val) => {
                                    const realVal = val;
                                    let valToUse = val;
                                    let conflictWarning = "";

                                    // CLINICAL CONFLICT DETECTION: e.g. Chest Pain + Scale 1
                                    const isCriticalSymptom = lastUrgency.includes("HIGH") || lastUrgency.includes("EMERGENCY");
                                    if (realVal <= 2 && isCriticalSymptom) {
                                        valToUse = 3; // Use Moderate internally to trigger booking
                                        conflictWarning = "⚠️ Clinical Note: Even if your current pain feels mild, your symptoms carry a high medical risk. \n\n";
                                    }

                                    setLivePain(realVal); // Keep UI honest to user click
                                    setPainScale(valToUse); // System uses the safer value
                                    setHasSelectedScale(true);
                                    setShowPainSelector(false);

                                    const label = SEVERITY[realVal]?.label.toLowerCase() || "mild";

                                    if (valToUse >= 3 || isCriticalSymptom) {
                                        setMessages((prev: any) => [...prev, {
                                            role: "assistant",
                                            content: `${conflictWarning}Understood. Based on the risk level associated with these symptoms, I strongly recommend a professional assessment. \n\nWould you like me to book an appointment at a nearby hospital?`
                                        }]);
                                        offeredBookingRef.current = true;
                                    } else {
                                        setMessages((prev: any) => [...prev, {
                                            role: "assistant",
                                            content: `Understood. Since your pain level is ${label}, here is a recommended **Home Care Plan**:\n\n• Rest in a comfortable position\n• Stay well hydrated\n• Monitor for new symptoms like dizziness or fever\n\nIf your condition worsens, seek medical attention immediately.`
                                        }]);
                                    }
                                }}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Streaming bubble */}
                {streamText && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="flex gap-2.5 max-w-[86%] items-end">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                                <Stethoscope size={14} className="text-white" />
                            </div>
                            <div className="px-4 py-3 text-[13.5px] glass-card text-slate-100 rounded-2xl rounded-tl-sm whitespace-pre-wrap">
                                {streamText}<span className="cursor-blink ml-0.5 text-blue-400">▋</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {isLoading && !streamText && (
                    <AnimatePresence><ThinkingDots /></AnimatePresence>
                )}

                <div ref={endRef} className="h-2" />
            </div>

            {/* ── Input Bar ── */}
            <div className="sticky bottom-0 z-30 px-6 pb-6 pt-4 border-t border-white/[0.04] bg-black/80 backdrop-blur-3xl">

                {/* Emergency alert */}
                <AnimatePresence>
                    {(livePain >= 3 || lastUrgency.includes("HIGH") || lastUrgency.includes("EMERGENCY")) && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-100 overflow-hidden">
                            <AlertTriangle size={12} className="animate-pulse text-red-500 flex-shrink-0" />
                            <strong>CLINICAL RISK DETECTED</strong>
                            <span className="opacity-60 ml-1">— priority triage enabled</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                            disabled={isLoading}
                            placeholder="Describe your symptoms in any language…"
                            className="w-full glass-input text-slate-100 rounded-xl py-3.5 pl-4 pr-24 text-[13.5px] placeholder:text-slate-600"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <div className="flex items-center gap-1 text-slate-700 text-[10px] pointer-events-none">
                                <Globe size={10} /><span>EN · हि · తె</span>
                            </div>
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-slate-800 text-slate-400'}`}
                            >
                                {isListening ? "🔴" : "🎤"}
                            </button>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="btn-glow w-11 h-11 rounded-xl text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:grayscale">
                        {isLoading
                            ? <Activity size={16} className="animate-spin" />
                            : <Send size={16} className="translate-x-[1px]" />}
                    </motion.button>
                </div>
                <p className="text-center text-[10px] text-slate-700 mt-3 font-medium opacity-40">
                    MediAI may make mistakes · Always follow professional medical advice
                </p>
            </div>
        </div>
    );
}
