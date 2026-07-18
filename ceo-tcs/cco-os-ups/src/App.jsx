import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Home as HomeIcon, FileText, CheckSquare, Sparkles, Search, Send, Paperclip,
  Settings, Mic, Users, AlertTriangle, TrendingUp, ArrowRight, ArrowLeft,
  Copy, Activity, Shield, Lightbulb, Clock, DollarSign, Radio,
  BarChart3, Scale, MessageCircle, Building2, Truck, HeartPulse, Globe,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Check, RotateCcw, Play, Save,
  Zap, Target, Briefcase, Eye, ChevronDown, Loader2, GitBranch,
  X, Minus, MessageSquare, Trash2, Swords, Plus,
  FileEdit, Mail, Share2, Download, Maximize2, Minimize2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Legend,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Tooltip, CartesianGrid
} from "recharts";
import { ReactFlow, Handle, Position, Controls } from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import { fetchHomeCards, fetchKPIs, fetchSignals, fetchSignalDetail, chatWithAgent, chatWithAgentStream, runFastSimulation, streamFastSimulation, fetchLevers, fetchScenarios, runDeepSimulation, saveScenario, loadScenario, fetchABMInsights, fetchEntInsights, fetchMarketSignals, fetchMarketSignalDetail, fetchEntSnapshot, fetchDAOverview, fetchPacket, fetchDealLevers, fetchEntInitiatives, simulateDealWorkbench, createEntInitiative, fetchAttention, fetchAttentionCategories, fetchAttentionGroups, fetchMemoryItems, fetchTicker, fetchWargameCompetitors, fetchWargameSim, fetchChatSessions, fetchChatMessages, deleteChatSession, fetchSimSessions, fetchSimMessages, createSimSession, saveSimMessage, deleteSimSession, loginUser, registerUser, logoutUser, getStoredUser, isAuthenticated, saveSimulationAsMemory, deleteMemoryItem, streamAlignmentBrief, lookupBrief, saveBrief, uploadDocument, DEFAULT_LLM_PROVIDER } from "./api";
import { LogIn, UserPlus, LogOut } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { downloadReport, captureCharts } from "./pdfExport";

/* ------------------------------------------------------------------ TIMEZONE HELPER — all timestamps EST */
const EST_TZ = "America/New_York";
const estNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: EST_TZ }));
const fmtDate = (opts = {}) => new Date().toLocaleDateString("en-US", { timeZone: EST_TZ, ...opts });
const fmtTime = (opts = {}) => new Date().toLocaleTimeString("en-US", { timeZone: EST_TZ, hour: "2-digit", minute: "2-digit", ...opts });
const fmtDateTime = (d, opts = {}) => new Date(d).toLocaleDateString("en-US", { timeZone: EST_TZ, ...opts });

/* ------------------------------------------------------------------ DESIGN SYSTEM · 4 premium themes */
const THEMES = {
  wallStreet: {
    name: "Wall Street Executive", desc: "Cream, deep navy, champagne gold",
    swatch: ["#FAF8F3", "#0A1628", "#B89B5E"], mode: "light",
    paper:"#FAF8F3", navBg:"#0A1628", navBg2:"#0F1F36", brand:"#1B3A6B", brandLt:"#34568A",
    gold:"#B89B5E", goldDk:"#7F6938", ink:"#0C1116", ink2:"#2C3540", muted:"#6A7480", faint:"#9DA6B0",
    card:"#FFFFFF", line:"#EAE6DC", line2:"#D9D2C4",
    red:"#A8453B", redBg:"#FBECEA", green:"#2D6B4A", greenBg:"#EAF3EE", amber:"#B5862C", amberBg:"#FAF1DD",
  },
  onyx: {
    name: "Onyx Midnight", desc: "Black onyx, warm champagne accents",
    swatch: ["#0E0F12", "#16181D", "#D4B574"], mode: "dark",
    paper:"#0E0F12", navBg:"#050609", navBg2:"#0A0B0E", brand:"#C9A961", brandLt:"#E6C77F",
    gold:"#D4B574", goldDk:"#A38845", ink:"#F0EDE3", ink2:"#C3BDB0", muted:"#7A7468", faint:"#4E4940",
    card:"#16181D", line:"#232529", line2:"#2E3036",
    red:"#D4634D", redBg:"#2A1411", green:"#5DAA85", greenBg:"#0F2218", amber:"#D9B265", amberBg:"#25190A",
  },
  porcelain: {
    name: "Porcelain", desc: "Pure white minimalism, graphite & ochre",
    swatch: ["#FCFCFC", "#1A1A1A", "#B07D2A"], mode: "light",
    paper:"#FCFCFC", navBg:"#1A1A1A", navBg2:"#232323", brand:"#2C2C2C", brandLt:"#4A4A4A",
    gold:"#B07D2A", goldDk:"#7A5618", ink:"#0A0A0A", ink2:"#3A3A3A", muted:"#7A7A7A", faint:"#B0B0B0",
    card:"#FFFFFF", line:"#ECECEC", line2:"#DDDDDD",
    red:"#B83D33", redBg:"#FBE8E5", green:"#2C7D5F", greenBg:"#E8F2EC", amber:"#B07D2A", amberBg:"#FAF1DD",
  },
  bordeaux: {
    name: "Bordeaux Estate", desc: "Wine, parchment, antique brass",
    swatch: ["#F6F1EB", "#3E1218", "#B08552"], mode: "light",
    paper:"#F6F1EB", navBg:"#3E1218", navBg2:"#4F1820", brand:"#7E2D38", brandLt:"#9D4250",
    gold:"#B08552", goldDk:"#7A5A30", ink:"#1A0E10", ink2:"#3E2E32", muted:"#7A6868", faint:"#A89894",
    card:"#FFFEF9", line:"#E8DFD5", line2:"#D6CBBC",
    red:"#A83A2E", redBg:"#FAE8E4", green:"#4A7D5F", greenBg:"#EAF2EC", amber:"#B08552", amberBg:"#F5EBDB",
  },
  upsBrand: {
    name: "UPS Shield", desc: "Pullman brown, UPS gold, warm tan",
    swatch: ["#FBF6EF", "#351C15", "#FFB500"], mode: "light",
    paper:"#FBF6EF", navBg:"#351C15", navBg2:"#4A2E1C", brand:"#644117", brandLt:"#7D5A2F",
    gold:"#FFB500", goldDk:"#CC9100", ink:"#1A0E08", ink2:"#3E2A1C", muted:"#7A6858", faint:"#A89880",
    card:"#FFFFFF", line:"#E8DECE", line2:"#D5C4AE",
    red:"#A83A2E", redBg:"#FBECEA", green:"#2D6B4A", greenBg:"#EAF3EE", amber:"#D4920A", amberBg:"#FFF5D6",
  },
};

const C = {};
const T = {
  /* static tokens */
  radSm: 6, radMd: 10, radLg: 14, radXl: 18, radPill: 999,
  ease: "cubic-bezier(.22,.61,.36,1)",
  /* dynamic tokens — overwritten by applyTheme */
  shadow1: "", shadow2: "", shadow3: "", shadowGoldGlow: "",
  goldFoil: "", navGrad: "", paperGrad: "", cardElevated: "",
  rule: "", ruleStrong: "", hairlineGold: "",
};

function applyTheme(name) {
  const t = THEMES[name] || THEMES.wallStreet;
  /* update palette */
  Object.keys(C).forEach(k => delete C[k]);
  Object.entries(t).forEach(([k, v]) => { if (typeof v === "string") C[k] = v; });
  /* derived tokens */
  const isDark = t.mode === "dark";
  const inkRgb = isDark ? "0,0,0" : "12,17,22";
  const goldR = parseInt(t.gold.slice(1,3),16), goldG = parseInt(t.gold.slice(3,5),16), goldB = parseInt(t.gold.slice(5,7),16);
  const goldFoilLight = `linear-gradient(135deg, ${shade(t.gold, 18)} 0%, ${t.gold} 50%, ${t.goldDk} 100%)`;
  T.shadow1 = isDark ? `0 1px 2px rgba(0,0,0,.5), 0 1px 1px rgba(0,0,0,.4)` : `0 1px 2px rgba(${inkRgb},.04), 0 1px 1px rgba(${inkRgb},.03)`;
  T.shadow2 = isDark ? `0 6px 18px rgba(0,0,0,.55), 0 2px 6px rgba(0,0,0,.4)` : `0 4px 16px rgba(${inkRgb},.06), 0 2px 4px rgba(${inkRgb},.04)`;
  T.shadow3 = isDark ? `0 24px 56px rgba(0,0,0,.7), 0 8px 20px rgba(0,0,0,.5)` : `0 18px 48px rgba(${inkRgb},.10), 0 6px 16px rgba(${inkRgb},.06)`;
  T.shadowGoldGlow = `0 0 0 1px rgba(${goldR},${goldG},${goldB},.22), 0 8px 28px rgba(${goldR},${goldG},${goldB},.18)`;
  T.goldFoil = goldFoilLight;
  T.navGrad = `linear-gradient(180deg, ${t.navBg} 0%, ${t.navBg2} 60%, ${t.navBg} 100%)`;
  T.paperGrad = isDark
    ? `linear-gradient(180deg, ${t.paper} 0%, ${shade(t.paper, -4)} 100%)`
    : `linear-gradient(180deg, ${t.paper} 0%, ${shade(t.paper, -5)} 100%)`;
  T.cardElevated = isDark
    ? `linear-gradient(180deg, ${t.card} 0%, ${shade(t.card, 3)} 100%)`
    : `linear-gradient(180deg, ${t.card} 0%, ${shade(t.card, -3)} 100%)`;
  T.rule = `1px solid ${t.line}`;
  T.ruleStrong = `1px solid ${t.line2}`;
  T.hairlineGold = `1px solid rgba(${goldR},${goldG},${goldB},.30)`;
}

function shade(hex, pct) {
  const h = hex.replace("#",""); const num = parseInt(h, 16);
  let r = (num >> 16) + Math.round(255 * pct / 100);
  let g = ((num >> 8) & 0xff) + Math.round(255 * pct / 100);
  let b = (num & 0xff) + Math.round(255 * pct / 100);
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

const _initialTheme = (typeof localStorage !== "undefined" && localStorage.getItem("cxo-theme") && THEMES[localStorage.getItem("cxo-theme")]) ? localStorage.getItem("cxo-theme") : "upsBrand";
applyTheme(_initialTheme);
const FONT = `'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
const DISP = `'Archivo', 'IBM Plex Sans', -apple-system, sans-serif`;
const SERIF = `'Cormorant Garamond', 'Times New Roman', Georgia, serif`;

/* Sidebar collapse state — shared across tree */
const SidebarCtx = React.createContext({ collapsed: false });
const useSidebar = () => React.useContext(SidebarCtx);

/* Voice input hook */
function useVoiceInput(onResult) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = false; rec.continuous = false;
    rec.onresult = (e) => { const t = e.results[0][0].transcript; onResult(t); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };
  const stop = () => { if (recRef.current) { recRef.current.stop(); setListening(false); } };
  const toggle = () => listening ? stop() : start();
  return { listening, toggle };
}

/* ------------------------------------------------------------------ React Flow custom node for decision trees */
function TreeCardNode({ data }) {
  return (
    <div style={{ minWidth:180, maxWidth:210, padding:"12px 14px", borderRadius:10,
      background: `${data.color}14`, border:`1.5px solid ${data.color}55`,
      fontFamily:"inherit" }}>
      <Handle type="target" position={Position.Left} style={{ background: data.color, width:7, height:7, border:"none" }} />
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
        <div style={{ width:9, height:9, borderRadius:999, background:data.color, flexShrink:0,
          boxShadow:`0 0 6px ${data.color}66` }} />
        <div style={{ fontSize:11.5, fontWeight:600, color:data.ink || "#0C1116", lineHeight:1.3 }}>{data.label}</div>
      </div>
      {data.sub && <div style={{ fontSize:10.5, color:data.muted || "#6A7480", lineHeight:1.5 }}>{data.sub}</div>}
      <Handle type="source" position={Position.Right} style={{ background: data.color, width:7, height:7, border:"none" }} />
    </div>
  );
}
const treeNodeTypes = { treeCard: TreeCardNode };

/* Toast system — replaces native alert()/confirm */
const ToastCtx = React.createContext({ push: () => {} });
const useToast = () => React.useContext(ToastCtx);

function ToastHost({ toasts, onDismiss }) {
  return (
    <div style={{ position:"fixed", bottom:90, right:30, zIndex:2000, display:"flex", flexDirection:"column", gap:10, pointerEvents:"none", maxWidth:380 }}>
      {toasts.map(t => {
        const tone = t.tone || "info";
        const accent = tone === "success" ? C.green : tone === "warn" ? C.amber : tone === "error" ? C.red : tone === "stub" ? C.goldDk : C.brand;
        const Icon = tone === "success" ? Check : tone === "warn" ? AlertTriangle : tone === "error" ? AlertTriangle : tone === "stub" ? Clock : Sparkles;
        return (
          <div key={t.id} style={{ pointerEvents:"auto", background:"rgba(255,255,255,.96)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
            border:`1px solid ${C.line2}`, borderRadius:T.radLg, padding:"14px 16px 14px 14px",
            boxShadow:T.shadow3, display:"flex", gap:12, alignItems:"flex-start",
            animation:"fadeIn .25s ease-out", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:accent }} />
            <div style={{ width:30, height:30, borderRadius:8, background:`${accent}15`, display:"grid", placeItems:"center", flexShrink:0, marginLeft:4 }}>
              <Icon size={14} color={accent} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              {t.title && <div style={{ fontFamily:DISP, fontWeight:600, fontSize:13, color:C.ink, marginBottom:t.body?3:0, letterSpacing:"-.005em" }}>{t.title}</div>}
              {t.body && <div style={{ fontSize:11.5, color:C.muted, lineHeight:1.55 }}>{t.body}</div>}
              {t.note && <div style={{ fontSize:10, color:C.faint, marginTop:6, fontStyle:"italic", letterSpacing:".02em" }}>{t.note}</div>}
            </div>
            <button onClick={() => onDismiss(t.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.faint, fontSize:14, padding:0, fontFamily:FONT, lineHeight:1, flexShrink:0 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ SHARED SCREEN HELPERS */
function SH({ kicker, title, sub, right }) {
  const hdr = (
    <>
      {kicker && (
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <span style={{ width:18, height:1, background:T.goldFoil, display:"inline-block" }} />
          <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", fontFamily:FONT }}>{kicker}</span>
        </div>
      )}
      {title && <div style={{ fontFamily:DISP, fontWeight:600, fontSize:30, color:C.ink, marginBottom:6, letterSpacing:"-.015em", lineHeight:1.1 }}>{title}</div>}
      {sub && <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.6, maxWidth:680, fontWeight:400 }}>{sub}</div>}
    </>
  );
  return <div style={{ marginBottom:24 }}>{right ? <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:24 }}><div style={{ minWidth:0 }}>{hdr}</div><div style={{ flexShrink:0 }}>{right}</div></div> : hdr}</div>;
}

function KCard({ label, value, delta, deltaLabel, status, sub }) {
  const sc = status === "ok" ? C.green : status === "warn" ? C.amber : C.red;
  const accentTop = status === "ok" ? C.green : status === "warn" ? C.amber : status === "miss" ? C.red : C.gold;
  return (
    <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:accentTop, opacity:.55 }} />
      <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.muted, fontWeight:700, marginBottom:10, textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontFamily:DISP, fontWeight:600, fontSize:32, color:C.ink, marginBottom:8, letterSpacing:"-.02em", lineHeight:1.05 }}>{value}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:sub?12:0 }}>
        {delta && <span style={{ fontSize:13, fontWeight:700, color:sc, letterSpacing:".01em" }}>{delta}</span>}
        {deltaLabel && <span style={{ fontSize:11, color:C.faint, fontWeight:500 }}>{deltaLabel}</span>}
      </div>
      {sub && <div style={{ fontSize:11.5, color:C.muted, lineHeight:1.5, borderTop:`1px solid ${C.line}`, paddingTop:10 }}>{sub}</div>}
    </div>
  );
}

function TagChip({ tone, children }) {
  const t = { gold: [C.amberBg, C.amber], teal: [C.greenBg, C.green], brick: [C.redBg, C.red], blue: [`${C.brand}15`, C.brandLt], amber: [C.amberBg, C.amber] }[tone] || [`${C.faint}18`, C.muted];
  return <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, fontWeight: 700, background: t[0], color: t[1] }}>{children}</span>;
}

function SDot({ s }) {
  const c = { ok: C.green, warn: C.amber, miss: C.red, G: C.green, A: C.amber, R: C.red, warm: C.green, cool: C.amber, cold: C.red }[s] || C.faint;
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, display: "inline-block" }} />;
}

function AIChip({ tone, children }) {
  const t = { gold: [C.gold, C.goldDk], teal: [C.green, C.green], red: [C.red, C.red], blue: [C.brandLt, C.brandLt], amber: [C.amber, C.amber] }[tone] || [C.gold, C.goldDk];
  return (
    <div style={{ flex: 1, background: `${t[0]}08`, border: `1px solid ${t[0]}33`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.ink2, borderLeft: `3px solid ${t[0]}` }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", color: t[1], marginRight: 8 }}>AI</span>
      {children}
    </div>
  );
}

function LeverSlider({ cat, title, value, setValue, min, max, unit, desc, impact }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 10, letterSpacing: ".12em", color: C.goldDk, fontWeight: 700, textTransform: "uppercase" }}>{cat}</div>
        <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 16, color: C.goldDk }}>{value}{unit}</span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginBottom: 8 }}>{desc}</div>
      <input type="range" min={min} max={max} value={value} onChange={e => setValue(+e.target.value)} style={{ width: "100%", accentColor: C.gold, marginBottom: 6 }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.faint }}>
        <span>{min}{unit} — {max}{unit}</span>
        <span style={{ color: C.green }}>{impact}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ DATA */
const HOME_CARDS = [
  {
    tone: "urgent", tag: "HIGH PRIORITY", icon: AlertTriangle,
    title: "Q2 SMB BACKFILL PACING",
    body: "SMB revenue growth is 4.8% behind the network-backfill plan as the Amazon glide-down completes this month. Existing accounts are stable, but newly acquired SMB cohorts show weaker first-90-day ship frequency and lower 90-day revenue retention. Digital-acquisition decay, onboarding completion gaps, and a crowded competitive pricing window may be suppressing durable, high-yield growth.",
    cta: "INVESTIGATE BACKFILL GAP", to: "investigate",
  },
  {
    tone: "amber", tag: "EMERGING RISK", icon: AlertTriangle,
    title: "EUROPE EXPORT YIELD & SENTIMENT DIP",
    body: "Net customer sentiment on Europe export lanes is down 9 pts over the last 14 days following the latest rate adjustment and de-minimis policy shifts. Freight-forwarder chatter is amplifying the narrative, and SMB export bookings have softened despite healthy network on-time performance.",
    cta: "INVESTIGATE EXPORT DIP", to: "signals",
  },
  {
    tone: "green", tag: "OPPORTUNITY", icon: TrendingUp,
    title: "HEALTHCARE COLD-CHAIN WINDOW OPENING",
    body: "Temperature-controlled and clinical-trial logistics demand in the US Northeast and EU is up 11% QoQ, and a key competitor just delayed a regional cold-chain facility. There's a 6–8 week window to lock in enterprise healthcare contracts and dedicated capacity before peak.",
    cta: "EXPLORE OPPORTUNITY", to: "decision",
  },
];

const HOME_CHIPS = ["Today's Brief", "Review SMB onboarding funnel", "Account retention deep-dive", "Digital Access signals"];

const RECOVERY_TILES = [
  { label: "REVENUE VS PLAN",            val: "−4.8%",  note: "top-level commercial health", neg: true },
  { label: "INSTALLED-BASE YIELD",       val: "+3.2%",  note: "core accounts stable",        neg: false },
  { label: "NEW-ACCOUNT 90-DAY RETENTION", val: "−9.6%", note: "activation weakness",        neg: true },
  { label: "FIRST 90-DAY SHIP FREQUENCY", val: "−11.4%", note: "key leading indicator",      neg: true },
  { label: "DIGITAL-ACQUIRED COHORT",    val: "−7.8%",  note: "quality vs historical",       neg: true },
  { label: "NEW-CUSTOMER SENTIMENT",     val: "−12 pts", note: "onboarding complaints +18%", neg: true },
];

const COHORT = [
  { period: "W1",  base: 96, neu: 88 },
  { period: "W2",  base: 91, neu: 74 },
  { period: "W4",  base: 86, neu: 58 },
  { period: "W8",  base: 82, neu: 44 },
  { period: "W12", base: 79, neu: 33 },
  { period: "W16", base: 77, neu: 27 },
];

const LEVERS_INIT = [
  { id: "digital",  label: "Digital reactivation campaign", meta: "+18% gap · Lo cost",  gap: 18, on: true },
  { id: "onboard",  label: "Onboarding friction fix",       meta: "+22% gap · Hi impact", gap: 22, on: true },
  { id: "regional", label: "Regional lifecycle pricing",    meta: "+12% gap · Lo cost",  gap: 12, on: true },
  { id: "success",  label: "Customer-success outreach",     meta: "+5% gap · Lo cost",   gap: 5,  on: false },
  { id: "rate",     label: "Peak-window rate shift",        meta: "+10% gap · No impact", gap: 10, on: false },
];

const SCENARIOS = [
  { id: "cons", title: "Conservative Recovery", sub: "Digital + lifecycle only", pct: 34 },
  { id: "reco", title: "Recommended Scenario",  sub: "Activation Sprint + Digital + Regional", pct: 62, rec: true },
  { id: "aggr", title: "Aggressive Recovery",   sub: "Adds discount ladder + capacity ask", pct: 27 },
];

const SIGNAL_CARDS = [
  {
    tag: "Urgent", tone: "urgent", title: "Cost-to-acquire rising faster than SMB yield recovery",
    metric: "ACQUISITION EFFICIENCY", delta: "−7.8% QoQ", deltaNeg: true,
    desc: "SMB acquisition cost is up 7.8% QoQ across paid digital and field-sales motions; quote-to-close is lagging the cost curve.",
    why: "Efficiency is declining across two major acquisition motions, creating pressure on the SMB backfill needed as Amazon volume exits.",
    src: "UPS Revenue Management", ago: "1h ago",
    rows: [
      ["Baseline", "CAC flat QoQ target"],
      ["Current", "SMB CAC +7.8% QoQ"],
      ["Time window", "Last quarter"],
      ["Source types", "Paid digital, field sales, MMM model"],
      ["Likely driver", "Auction inflation + softer landing-page conversion"],
    ],
    next: "Rebalance spend toward digital (DAP) and lifecycle channels",
    open: true,
  },
  {
    tag: "Opportunity", tone: "green", title: "Revenue quality holding strong",
    metric: "REVENUE PER PIECE", delta: "+6.5% YoY", deltaNeg: false,
    desc: "US Domestic revenue per piece reached $15.32, up 6.5% YoY, driven by base rates, mix, and fuel.",
    why: "Yield is outpacing the volume decline — the mix shift is working and creating room to be selective.",
    src: "UPS Finance", ago: "2h ago", rows: [], next: "",
  },
  {
    tag: "Opportunity", tone: "green", title: "Digital Access (DAP) momentum",
    metric: "DIGITAL-ATTRIBUTED REVENUE", delta: "+18% QoQ", deltaNeg: false,
    desc: "Digital Access Program signups are up 28% QoQ; digital-attributed SMB revenue up 18% QoQ.",
    why: "The quarterly trend is compounding — digital is becoming a durable, low-cost SMB acquisition channel.",
    src: "UPS Digital", ago: "3h ago",
    rows: [
      ["Baseline", "+10% signup target"],
      ["Current", "+28% QoQ"],
      ["Time window", "Last quarter"],
      ["Source types", "ups.com, DAP, marketplace integrations"],
      ["Likely driver", "SMB onboarding + integration partnerships"],
    ],
    next: "Expand digital incentives ahead of peak",
  },
];

const SIGNAL_ROW2 = [
  { title: "Healthcare crosses $3B quarter", tag: "Opportunity", tone: "green" },
  { title: "Customer sentiment stable across enterprise", tag: "Stable", tone: "amber" },
  { title: "Competitive pricing window tightens", tag: "Watch", tone: "amber" },
];

const KPI_TILES = [
  { label: "US Domestic ADV", val: "−8.0%", sub: "YoY", chip: "Volume", note: "Planned decline — Amazon glide-down completing June.", spark: [7,6,5,5,4,4,3], up:false },
  { label: "Revenue per Piece", val: "$15.32", sub: "+7.7% YoY", chip: "Yield", note: "Yield ahead of plan; base rates + mix driving gains.", spark: [3,4,4,5,6,6,7], up:true },
  { label: "SMB Penetration", val: "34.5%", sub: "record high", chip: "SMB", note: "Highest SMB share of US volume in company history.", spark: [4,5,5,6,6,7,7], up:true },
  { label: "Healthcare Revenue", val: "$3.0B", sub: "first $3B quarter", chip: "Healthcare", note: "Double-digit operating margin across all segments.", spark: [3,4,4,5,6,6,7], up:true },
  { label: "International Revenue", val: "$4.5B", sub: "+3.8% YoY", chip: "International", note: "Growth across all regions; premium-market focus.", spark: [4,5,5,5,6,6,7], up:true },
  { label: "Op Margin (consol.)", val: "6.0%", sub: "−1.7 pts", chip: "Margin", note: "~$350M transitional costs; recovery guided in Q2.", spark: [7,7,6,6,5,5,6], up:false },
  { label: "Customer Sentiment*", val: "74", sub: "+4 pts QoQ", chip: "Service", note: "Stable across enterprise even with rate activity.", spark: [5,5,6,6,6,7,7], up:true },
  { label: "Account Retention*", val: "91%", sub: "+0.7 pts QoQ", chip: "Retention", note: "Installed-base retention nudging up across verticals.", spark: [5,6,6,6,7,7,7], up:true },
];

const TAKEAWAYS = [
  { do: "Discuss a paid-digital spend pullback with the growth and field-sales teams", because: "it could lead to consensus around how much budget to shift out of inflating paid auctions this quarter.", impact: "Reallocates an estimated $2.4M of paid-digital spend into more efficient channels within 30 days." },
  { do: "Discuss the SMB onboarding & landing-page CRO backlog with the web and lifecycle teams", because: "it could lead to consensus around which activation fixes ship before the next acquisition push.", impact: "A prioritized 2-sprint activation plan targeting the 0.6 pt conversion gap on paid landing flows." },
  { do: "Discuss expanding digital-attributed (DAP) acquisition with the partnerships team", because: "it could lead to consensus around moving budget into channels where $/new-account beats paid digital.", impact: "Locks in 2–3 expanded marketplace / integration deals to absorb shifted spend at a lower blended CAC." },
  { do: "Discuss the CAC vs LTV narrative with finance ahead of the quarterly review", because: "it could lead to consensus around whether to hold or revise the FY CAC guardrail.", impact: "A pre-aligned CAC framing for finance review — no surprises in the QBR deck." },
];

const DECISION_CARDS = [
  { icon: Clock,        title: "Capacity Shift Simulation", rec: true, body: "What happens if UPS shifts field-sales and network capacity from enterprise to SMB during peak season?" },
  { icon: HeartPulse,   title: "Healthcare Push Simulation", body: "How would an expanded healthcare and cold-chain push affect revenue mix and segment margin?" },
  { icon: Users,        title: "SMB + Digital Audience", body: "Which customer segments are most likely to respond to a digital (DAP) + field-sales play?" },
  { icon: TrendingUp,   title: "Competitive Trends", body: "What competitive trends in parcel and logistics should UPS monitor over the next quarter?" },
  { icon: MessageCircle,title: "Customer Sentiment", body: "How is customer sentiment shifting across SMB, enterprise, healthcare and international?" },
  { icon: DollarSign,   title: "CFO Lens: SMB", body: "What would the CFO care about if UPS increases investment in SMB acquisition?" },
  { icon: Scale,        title: "Volume vs Yield", rec: true, body: "How should UPS balance volume vs revenue quality across the network as Amazon volume exits?" },
  { icon: Radio,        title: "External Signals", body: "What external signals should UPS watch across e-commerce, freight rates and trade policy?" },
];

/* ------------------------------------------------------------------ ATOMS */
const toneColor = (t) =>
  t === "urgent" ? { fg: C.red, bg: C.redBg } :
  t === "green"  ? { fg: C.green, bg: C.greenBg } :
  t === "amber"  ? { fg: C.amber, bg: C.amberBg } :
                   { fg: C.ink2, bg: C.paper };

function Pill({ tone, children }) {
  const k = toneColor(tone);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px",
      borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: ".04em",
      color: k.fg, background: k.bg, border: `1px solid ${k.fg}22` }}>
      {children}
    </span>
  );
}

function Spark({ data, up }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 20 }}>
      {data.map((d, i) => (
        <div key={i} style={{ width: 5, height: `${(d / max) * 100}%`,
          background: up ? C.gold : C.brandLt, borderRadius: 1, opacity: 0.55 + 0.45 * (i / data.length) }} />
      ))}
    </div>
  );
}

function Btn({ children, onClick, kind = "primary", small, disabled, style }) {
  const styles = {
    primary: { background: C.brand, color: "#fff", border: "none", boxShadow: T.shadow1 },
    gold:    { background: T.goldFoil, color: C.navBg, border: "none", fontWeight: 700, boxShadow: T.shadowGoldGlow },
    ghost:   { background: C.card, color: C.ink, border: `1px solid ${C.line2}`, boxShadow: T.shadow1 },
    quiet:   { background: "transparent", color: C.ink2, border: `1px solid ${C.line}`, boxShadow: "none" },
  }[kind];
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = T.shadow2; e.currentTarget.style.background = C.navBg; e.currentTarget.style.color = C.paper; e.currentTarget.style.borderColor = C.navBg; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = styles.boxShadow || T.shadow1; e.currentTarget.style.background = styles.background; e.currentTarget.style.color = styles.color; e.currentTarget.style.borderColor = styles.border ? "" : "transparent"; }}
      onMouseDown={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(0) scale(0.97)"; }}}
      onMouseUp={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-1px)"; }}}
      style={{ ...styles, cursor: disabled?"default":"pointer", borderRadius: T.radMd,
      padding: small ? "7px 14px" : "11px 18px", fontSize: small ? 12 : 13,
      fontWeight: styles.fontWeight || 600, fontFamily: FONT, letterSpacing: ".02em",
      display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
      opacity: disabled ? 0.5 : 1, transition: `transform .15s ${T.ease}, box-shadow .2s ${T.ease}, filter .15s ${T.ease}`,
      ...style }}>
      {children}
    </button>
  );
}

function ChatPanel({ open, minimized, messages, loading, onSend, onSimulate, onClose, onMinimize, onExpand, onNewChat, sessions, onLoadSession, onDeleteSession, activeSessionId, contextQuestions, provider = "gemini", onProviderChange }) {
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const chatEndRef = React.useRef(null);
  const voice = useVoiceInput((t) => setInput(prev => prev ? prev + " " + t : t));
  React.useEffect(() => { if (open && !minimized) chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, open, minimized]);

  const DEFAULT_PROMPTS = [
    "What needs my attention today?",
    "What's happening with Ford?",
    "Summarize the AutoZone situation",
    "What are our biggest risks this quarter?",
  ];
  const QUICK_PROMPTS = (contextQuestions && contextQuestions.length > 0) ? contextQuestions : DEFAULT_PROMPTS;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const result = await uploadDocument(file);
      setAttachedDoc({ filename: result.filename, text: result.text_content, charCount: result.char_count });
    } catch (err) {
      alert(err.message || "Failed to upload document");
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!input.trim() && !attachedDoc) return;
    onSend(input.trim(), attachedDoc?.text);
    setInput("");
    setAttachedDoc(null);
  };

  if (!open) return null;

  if (minimized) {
    return (
      <div onClick={onExpand} style={{ position:"fixed", bottom:20, right:24, zIndex:1100, cursor:"pointer",
        background:C.brand, color:"#fff", borderRadius:T.radPill, padding:"10px 18px",
        display:"flex", alignItems:"center", gap:8, boxShadow:T.shadow3, fontFamily:FONT, fontSize:12, fontWeight:600,
        transition:`transform .2s ${T.ease}` }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        <MessageSquare size={14} />
        <span>Chat · {messages.length} message{messages.length !== 1 ? "s" : ""}</span>
      </div>
    );
  }

  const historyContent = (
    <div style={{ overflowY:"auto", flex:1, padding:"8px 10px" }}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.goldDk, textTransform:"uppercase", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
        <Clock size={9} /> Previous Chats
      </div>
      {(!sessions || sessions.length === 0) ? (
        <div style={{ fontSize:12, color:C.faint, padding:"12px 0", textAlign:"center" }}>No previous chats</div>
      ) : sessions.map(s => (
        <div key={s.id}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, marginBottom:4,
            cursor:"pointer", background:s.id === activeSessionId ? `${C.gold}12` : "transparent",
            border:`1px solid ${s.id === activeSessionId ? C.gold + "30" : "transparent"}`,
            transition:`all .15s ${T.ease}` }}
          onMouseEnter={e => { if(s.id !== activeSessionId) e.currentTarget.style.background = C.card; }}
          onMouseLeave={e => { if(s.id !== activeSessionId) e.currentTarget.style.background = "transparent"; }}>
          <div onClick={() => { onLoadSession(s.id); if (!expanded) setShowHistory(false); }} style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.title}</div>
            <div style={{ fontSize:10, color:C.faint, marginTop:2 }}>
              {s.message_count} msg{s.message_count !== 1 ? "s" : ""} · {s.created_at ? fmtDateTime(s.created_at, {month:"short", day:"numeric"}) : ""}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
            style={{ width:22, height:22, borderRadius:4, border:"none", background:"transparent", cursor:"pointer",
              display:"grid", placeItems:"center", color:C.faint, flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.color = C.red; e.currentTarget.style.background = `${C.red}10`; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = "transparent"; }}>
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  );

  const headerBar = (
    <div style={{ padding:"10px 14px", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:24, height:24, borderRadius:6, background:T.goldFoil, display:"grid", placeItems:"center" }}>
          <MessageSquare size={12} color="#0A1628" />
        </div>
        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:13, color:C.ink, letterSpacing:"-.01em" }}>CXO Companion</div>
      </div>
      <div style={{ display:"flex", gap:4 }}>
        {[
          { icon: Plus, title: "New chat", onClick: onNewChat, active: false },
          { icon: Clock, title: "Chat history", onClick: () => setShowHistory(h => !h), active: showHistory },
          { icon: expanded ? Minimize2 : Maximize2, title: expanded ? "Shrink" : "Expand", onClick: () => setExpanded(e => !e), active: false },
          { icon: Minus, title: "Minimize", onClick: onMinimize, active: false },
          { icon: X, title: "Close", onClick: () => { setExpanded(false); onClose(); }, active: false },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick} style={{ width:24, height:24, borderRadius:5,
            border:`1px solid ${btn.active ? C.gold : C.line}`,
            background: btn.active ? `${C.gold}10` : C.card,
            display:"grid", placeItems:"center", cursor:"pointer",
            color: btn.active ? C.goldDk : C.muted }}
            title={btn.title}><btn.icon size={11} /></button>
        ))}
      </div>
    </div>
  );

  // Model switch — Gemini vs SLM. Present on every screen's companion dock.
  const modelBar = (
    <div style={{ padding:"7px 14px", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center",
      justifyContent:"space-between", gap:10, flexShrink:0, background:`${C.gold}05` }}>
      {provider === "slm" ? (
        <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:".16em", color:C.goldDk, textTransform:"uppercase" }}>
          Powered by TwinX<sup style={{ fontSize:5, verticalAlign:"super", lineHeight:0 }}>TM</sup>
        </span>
      ) : (
        <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:".2em", color:C.faint, textTransform:"uppercase" }}>Model</span>
      )}
      <div style={{ display:"flex", gap:2, background:C.card, border:`1px solid ${C.line2}`, borderRadius:T.radPill, padding:2 }}>
        {[["gemini","Gemini"],["slm","SLM"]].map(([val,label]) => {
          const active = provider === val;
          return (
            <button key={val} onClick={() => onProviderChange && onProviderChange(val)} title={`Use ${label}`}
              style={{ padding:"3px 14px", fontSize:10, fontWeight:700, borderRadius:T.radPill, border:"none",
                cursor:"pointer", fontFamily:FONT, letterSpacing:".04em", textTransform:"uppercase",
                background: active ? T.goldFoil : "transparent",
                color: active ? C.navBg : C.muted,
                boxShadow: active ? T.shadowGoldGlow : "none",
                transition:`all .15s ${T.ease}` }}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (<>
    {/* History sidebar — separate panel when not expanded */}
    {showHistory && !expanded && (
      <div style={{ position:"fixed", bottom:14, right:444, width:280, height:"70vh", zIndex:1200,
        display:"flex", flexDirection:"column",
        background:T.paperGrad, border:`1px solid ${C.line}`, borderRadius:T.radLg,
        boxShadow:`0 8px 40px rgba(0,0,0,.12)`, animation:"fadeIn .2s ease", overflow:"hidden" }}>
        {historyContent}
      </div>
    )}

    {/* Main chat panel */}
    <div style={{ position:"fixed", zIndex:1200,
      ...(expanded
        ? { top:14, right:14, bottom:14, left:14, width:"auto" }
        : { bottom:14, right:14, width:420, height:"78vh" }),
      display:"flex", flexDirection: expanded && showHistory ? "row" : "column",
      background:T.paperGrad, border:`1px solid ${C.line}`, borderRadius:T.radLg,
      boxShadow:`0 8px 40px rgba(0,0,0,.18), 0 0 0 1px ${C.line}`,
      animation:"slideIn .25s ease", overflow:"hidden",
      transition:"all .25s cubic-bezier(.4,0,.2,1)" }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>

      {/* History sidebar inside expanded view */}
      {showHistory && expanded && (
        <div style={{ width:280, flexShrink:0, borderRight:`1px solid ${C.line}`, display:"flex", flexDirection:"column", background:`${C.gold}04`, overflow:"hidden" }}>
          {historyContent}
        </div>
      )}

      {/* Chat column */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        {headerBar}
        {modelBar}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 14px 6px" }}>
        {messages.length === 0 ? (
          <div style={{ padding:"24px 0", textAlign:"center" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:T.goldFoil, display:"grid", placeItems:"center", margin:"0 auto 12px" }}>
              <MessageSquare size={18} color="#0A1628" />
            </div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:C.ink, marginBottom:4 }}>Ask anything</div>
            <div style={{ fontSize:11.5, color:C.muted, lineHeight:1.5, marginBottom:16 }}>
              Full context on your portfolio, decisions, signals, and KPIs.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {QUICK_PROMPTS.map(q => (
                <button key={q} onClick={() => onSend(q)} style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radMd,
                  padding:"8px 12px", fontSize:11.5, color:C.ink2, cursor:"pointer", fontFamily:FONT, textAlign:"left",
                  transition:`border-color .2s ${T.ease}, background .2s ${T.ease}` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = `${C.gold}08`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.background = C.card; }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {(() => { const filtered = messages.filter(m => !(m.role === "agent" && !m.text && !m.options && !m.simResult && !m.sources && !m.quickReplies)); return filtered.map((m, i) => (
              <div key={i} style={{ marginBottom:12, display:"flex", flexDirection:"column", alignItems: m.role === "user" ? "flex-end" : "flex-start", minWidth:0, maxWidth:"100%" }}>
                <div style={{ maxWidth: m.role === "user" ? "88%" : "100%", padding:"8px 12px", borderRadius:10,
                  background: m.role === "user" ? C.brand : C.card,
                  color: m.role === "user" ? "#fff" : C.ink,
                  border: m.role === "user" ? "none" : `1px solid ${C.line}`,
                  fontSize:12, lineHeight:1.55, boxShadow: m.role === "user" ? "none" : T.shadow1,
                  minWidth:0, overflow:"hidden" }}>
                  {m.role === "user" ? m.text : (
                    <div className="markdown-body" style={{ margin:0, padding:0, fontSize:12, overflowX:"auto", overflowY:"hidden", wordBreak:"break-word" }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>
                  )}
                  {m.role === "agent" && !m.isStreaming && m.sources && <SourcesDisclosure sources={m.sources} />}
                </div>
                {m.role === "agent" && (
                  <div style={{ maxWidth:"100%", minWidth:0, paddingLeft:2, paddingRight:2, marginBottom:4 }}>
                    {m.isStreaming && m.isSkeletonReplies && <SignalSkeletonChips />}
                    {!m.isStreaming && i === filtered.length - 1 && (() => {
                      const userCount = filtered.filter(x => x.role === "user").length;
                      let chips = userCount >= 2
                        ? (m.quickReplies || [])
                        : (m.quickReplies || []).filter(c => !/simulat|decision lab/i.test(c.text));
                      if (userCount >= 2 && !chips.some(c => /simulat|decision lab/i.test(c.text))) {
                        chips = [...chips, { text: "Go to Decision Lab" }];
                      }
                      if (!chips.length) return null;
                      return <SignalQuickReplyChips chips={chips} onSelect={(t) => {
                        const isSimChip = /simulat|decision lab/i.test(t);
                        if (isSimChip && onSimulate) onSimulate();
                        else onSend(t);
                      }} />;
                    })()}
                  </div>
                )}
              </div>
            )); })()}
            <style>{`@keyframes sigChatBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
@keyframes sigThinkShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
            {loading && !messages.some(m => m.role === "agent" && m.isStreaming && m.text) && (
              <ThinkingIndicator />
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={{ padding:"8px 12px 10px", borderTop:`1px solid ${C.line}`, flexShrink:0 }}>
        {attachedDoc && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px 6px", fontSize:11, color:C.goldDk, fontFamily:FONT }}>
            <FileText size={12} />
            <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{attachedDoc.filename}</span>
            <span style={{ fontSize:9, color:C.faint }}>{Math.round(attachedDoc.charCount / 1000)}k chars</span>
            <button onClick={() => setAttachedDoc(null)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"grid", placeItems:"center", color:C.faint }}>
              <X size={11} />
            </button>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:6, background:C.card, border:`1px solid ${C.line2}`,
          borderRadius:T.radPill, padding:"4px 4px 4px 10px" }}>
          <input type="file" ref={fileInputRef} accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display:"none" }} onChange={handleFileSelect} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading || loading}
            style={{ background:"none", border:"none", cursor: uploading ? "wait" : "pointer", padding:2, display:"grid", placeItems:"center", color: attachedDoc ? C.goldDk : C.faint, flexShrink:0, opacity: uploading ? .5 : 1 }}>
            {uploading ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> : <Paperclip size={14} />}
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder={attachedDoc ? "Ask about the document…" : "Ask your companion…"}
            style={{ flex:1, border:"none", outline:"none", fontSize:12, fontFamily:FONT, color:C.ink, background:"transparent", padding:"5px 0", minWidth:0 }} />
          <button onClick={voice.toggle} disabled={loading}
            style={{ width:28, height:28, borderRadius:999, border:`1px solid ${voice.listening ? C.red : C.line}`,
              background: voice.listening ? `${C.red}15` : "transparent", cursor: loading ? "not-allowed" : "pointer", display:"grid", placeItems:"center", flexShrink:0,
              animation: voice.listening ? "pulse 1.2s infinite" : "none", opacity: loading ? .4 : 1 }}
            title={voice.listening ? "Listening…" : "Voice input"}>
            <Mic size={12} color={voice.listening ? C.red : C.muted} />
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ background:T.goldFoil, color:C.navBg, border:"none", borderRadius:T.radPill,
              padding:"7px 14px", fontSize:10.5, fontWeight:700, cursor: loading ? "wait" : "pointer", fontFamily:FONT,
              letterSpacing:".08em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:5, flexShrink:0,
              opacity: loading ? .6 : 1, boxShadow:T.shadowGoldGlow }}>
            <Send size={11} /> Send
          </button>
        </div>
      </div>
      </div>{/* /chat column */}
    </div>{/* /main panel */}
  </>);
}

function ChatFAB({ onClick }) {
  return (
    <button onClick={onClick} style={{ position:"fixed", bottom:24, right:24, zIndex:1100, width:52, height:52,
      borderRadius:999, background:C.brand, color:"#fff", border:"none", cursor:"pointer",
      display:"grid", placeItems:"center", boxShadow:T.shadow3,
      transition:`transform .2s ${T.ease}, box-shadow .2s ${T.ease}` }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = T.shadow3; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = T.shadow2; }}>
      <MessageSquare size={22} />
    </button>
  );
}

/* ------------------------------------------------------------------ SIDEBAR */
function Sidebar({ view, go, collapsed, onToggle, themeName, setThemeName, user, onLogout, investigateSource }) {
  const [themeOpen, setThemeOpen] = useState(false);
  const topItems = [
    ["home", "Home", HomeIcon],
    ["signals", "Signals", FileText],
    ["memory", "Memory", CheckSquare],
    ["decision", "Decision Lab", Sparkles],
  ];
  const activeKey = view === "investigate" ? (investigateSource || "home")
    : ["simulator"].includes(view) ? "home"
    : ["signalDetail", "kpis"].includes(view) ? "signals"
    : view === "memory-detail" ? "memory" : view;

  const navBtn = (key, label, Icon) => {
    const on = activeKey === key;
    return (
      <button key={key} onClick={() => go(key)} title={collapsed ? label : undefined}
        style={{ display:"flex", alignItems:"center", gap:12,
          padding: collapsed ? "11px 0" : "11px 14px", borderRadius:T.radMd, cursor:"pointer", textAlign:"left",
          justifyContent: collapsed ? "center" : "flex-start",
          background: on ? "rgba(255,255,255,.05)" : "transparent",
          border:"none", position:"relative",
          color: on ? "#F4F1EA" : "rgba(244,241,234,.65)", fontFamily:FONT, fontSize:13, fontWeight: on?600:500,
          whiteSpace:"nowrap", overflow:"hidden", width:"100%", letterSpacing:".01em",
          transition:`background .2s ${T.ease}, color .2s ${T.ease}` }}>
        {on && <span style={{ position:"absolute", left:0, top:8, bottom:8, width:2, background:T.goldFoil, borderRadius:2 }} />}
        <Icon size={16} color={on ? C.gold : "rgba(244,241,234,.5)"} style={{ flexShrink:0 }} />
        {!collapsed && <span>{label}</span>}
        {!collapsed && on && <span style={{ marginLeft:"auto", width:5, height:5, borderRadius:999, background:C.gold, boxShadow:`0 0 0 3px rgba(184,155,94,.18)` }} />}
      </button>
    );
  };

  return (
    <div style={{ width: collapsed ? 72 : 240, background:T.navGrad,
      color:"#EADFD3", display:"flex", flexDirection:"column", flexShrink:0,
      padding: collapsed ? "22px 12px" : "26px 16px",
      borderRadius: T.radLg,
      border:"1px solid rgba(255,255,255,.06)",
      transition:`width .3s ${T.ease}, padding .3s ${T.ease}`,
      overflow:"hidden", position:"relative",
      boxShadow:"0 18px 48px rgba(0,0,0,.35), 0 6px 16px rgba(0,0,0,.20), inset 0 1px 0 rgba(255,255,255,.04)" }}>

      {/* Collapsed: logo centered, toggle pinned bottom-right of header. Expanded: logo + brand left, toggle right */}
      {collapsed ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24, gap:10 }}>
          <button onClick={onToggle} title="Expand"
            style={{ width:36, height:28, borderRadius:6, background:T.goldFoil, border:"none", cursor:"pointer",
              display:"grid", placeItems:"center", boxShadow:"0 4px 12px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.18)",
              transition:`transform .2s ${T.ease}` }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            <span style={{ fontFamily:DISP, fontWeight:600, color:C.navBg, fontSize:10.5, letterSpacing:".04em" }}>UPS</span>
          </button>
          <button onClick={onToggle} title="Expand"
            style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)", borderRadius:6,
              width:28, height:24, display:"grid", placeItems:"center", cursor:"pointer",
              color:"rgba(244,241,234,.55)" }}>
            <PanelLeftOpen size={13} />
          </button>
        </div>
      ) : (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, gap:12, minHeight:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, overflow:"hidden", flex:1, minWidth:0 }}>
            <div style={{ width:36, height:28, borderRadius:6, background:T.goldFoil, flexShrink:0,
              display:"grid", placeItems:"center", boxShadow:"0 4px 12px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.18)" }}>
              <span style={{ fontFamily:DISP, fontWeight:600, color:C.navBg, fontSize:10.5, letterSpacing:".04em" }}>UPS</span>
            </div>
            <div style={{ overflow:"hidden", lineHeight:1.15, minWidth:0 }}>
              <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:"#F4F1EA", whiteSpace:"nowrap", letterSpacing:".02em", lineHeight:1.2 }}>CXO Companion</div>
              <div style={{ fontSize:8.5, color:"rgba(184,155,94,.8)", whiteSpace:"nowrap", letterSpacing:".18em", marginTop:4, textTransform:"uppercase", fontWeight:600 }}>Powered by TwinX<sup style={{ fontSize:5, verticalAlign:"super", lineHeight:0 }}>TM</sup></div>
            </div>
          </div>
          <button onClick={onToggle} title="Collapse"
            style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:6,
              width:28, height:28, display:"grid", placeItems:"center", cursor:"pointer",
              color:"rgba(244,241,234,.6)", flexShrink:0, transition:`background .2s ${T.ease}` }}>
            <PanelLeftClose size={13} />
          </button>
        </div>
      )}

      {!collapsed && (
        <div style={{ marginBottom:18, paddingBottom:18, borderBottom:"1px solid rgba(255,255,255,.06)" }}>
          {/* <div style={{ fontSize:8.5, letterSpacing:".28em", color:"rgba(184,155,94,.6)", fontWeight:700, textTransform:"uppercase", marginBottom:6 }}>Workspace</div>
          <div style={{ fontSize:11.5, color:"rgba(244,241,234,.7)", fontWeight:500 }}>Commercial Strategy · FY26</div> */}
        </div>
      )}

      <nav style={{ display:"flex", flexDirection:"column", gap:3, overflowY:"auto", flex:1,
        scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,.12) transparent" }}>
        {topItems.map(([k, l, I]) => navBtn(k, l, I))}
      </nav>

      <div style={{ paddingTop:18, borderTop:"1px solid rgba(255,255,255,.08)", flexShrink:0, position:"relative" }}>
        {setThemeName && themeOpen && (() => {
          const popoverPos = collapsed
            ? { position:"fixed", left:80, bottom:88, width:260 }
            : { position:"fixed", left:16, bottom:88, width:260 };
          return (
            <div style={{ ...popoverPos, background:T.cardElevated,
              border:`1px solid ${C.line2}`, borderRadius:T.radMd, padding:12, boxShadow:T.shadow3,
              animation:"fadeIn .2s ease-out", zIndex:10 }}>
              <div style={{ fontSize:8.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", marginBottom:10, paddingLeft:4 }}>Theme</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {Object.entries(THEMES).map(([key, t]) => {
                  const isAct = key === themeName;
                  return (
                    <button key={key} onClick={() => { setThemeName(key); setThemeOpen(false); }}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px",
                        background:isAct?`${C.gold}12`:"transparent", border:`1px solid ${isAct?C.gold:C.line}`,
                        borderRadius:T.radSm, cursor:"pointer", textAlign:"left", fontFamily:FONT, transition:`background .15s ${T.ease}` }}
                      onMouseEnter={e => { if(!isAct) e.currentTarget.style.background = `${C.line}60`; }}
                      onMouseLeave={e => { if(!isAct) e.currentTarget.style.background = "transparent"; }}>
                      <div style={{ display:"flex", gap:0, flexShrink:0, borderRadius:3, overflow:"hidden", boxShadow:T.shadow1 }}>
                        {t.swatch.map((s,i) => <div key={i} style={{ width:12, height:26, background:s }}/>)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:DISP, fontSize:12, fontWeight:600, color:C.ink, lineHeight:1.2 }}>{t.name}</div>
                        <div style={{ fontSize:9.5, color:C.muted, marginTop:2, lineHeight:1.3 }}>{t.mode === "dark" ? "Dark" : "Light"} · {t.desc.split(",")[0]}</div>
                      </div>
                      {isAct && <Check size={13} color={C.gold} style={{ flexShrink:0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
        {collapsed ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <div style={{ width:38, height:38, borderRadius:999, background:T.goldFoil, flexShrink:0,
              display:"grid", placeItems:"center", color:C.navBg, fontWeight:600, fontSize:13, fontFamily:DISP,
              boxShadow:"0 4px 14px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.25)", letterSpacing:".02em" }}>
              {(user?.full_name || user?.username || "U").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {setThemeName && (
                <button onClick={() => setThemeOpen(o => !o)}
                  title="Theme"
                  style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:6,
                    width:28, height:28, display:"grid", placeItems:"center", cursor:"pointer",
                    color:"rgba(244,241,234,.5)", flexShrink:0, transition:`all .15s ${T.ease}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.10)"; e.currentTarget.style.color = "rgba(244,241,234,.85)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(244,241,234,.5)"; }}>
                  <Settings size={13} />
                </button>
              )}
              {onLogout && (
                <button onClick={onLogout} title="Sign out"
                  style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:6,
                    width:28, height:28, display:"grid", placeItems:"center", cursor:"pointer",
                    color:"rgba(244,241,234,.5)", flexShrink:0, transition:`all .15s ${T.ease}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,80,80,.15)"; e.currentTarget.style.color = "#ff6b6b"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(244,241,234,.5)"; }}>
                  <LogOut size={13} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <div style={{ width:34, height:34, borderRadius:999, background:T.goldFoil, flexShrink:0,
              display:"grid", placeItems:"center", color:C.navBg, fontWeight:600, fontSize:12, fontFamily:DISP,
              boxShadow:"0 4px 14px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.25)", letterSpacing:".02em" }}>
              {(user?.full_name || user?.username || "U").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div style={{ lineHeight:1.3, overflow:"hidden", flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:12, color:"#F4F1EA", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", letterSpacing:".01em" }}>{user?.full_name || user?.username || "User"}</div>
              <div style={{ fontSize:9.5, color:"rgba(184,155,94,.75)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", letterSpacing:".14em", marginTop:2, textTransform:"uppercase", fontWeight:600 }}>{user?.role || "Viewer"}</div>
            </div>
            {setThemeName && (
              <button onClick={() => setThemeOpen(o => !o)}
                title="Theme"
                style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:6,
                  width:28, height:28, display:"grid", placeItems:"center", cursor:"pointer",
                  color:"rgba(244,241,234,.5)", flexShrink:0, transition:`all .15s ${T.ease}` }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.10)"; e.currentTarget.style.color = "rgba(244,241,234,.85)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(244,241,234,.5)"; }}>
                <Settings size={13} />
              </button>
            )}
            {onLogout && (
              <button onClick={onLogout} title="Sign out"
                style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:6,
                  width:28, height:28, display:"grid", placeItems:"center", cursor:"pointer",
                  color:"rgba(244,241,234,.5)", flexShrink:0, transition:`all .15s ${T.ease}` }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,80,80,.15)"; e.currentTarget.style.color = "#ff6b6b"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(244,241,234,.5)"; }}>
                <LogOut size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ TOP TITLE — minimal premium spec */
function CenterTitle() {
  return null;
}

function ShellTop({ onBack }) {
  const now = estNow();
  const dateLabel = fmtDate({ weekday:"long", month:"long", day:"numeric", year:"numeric" });
  const [ticker, setTicker] = useState({ price:98.52, change_pct:-1.23, trade_date:"" });
  useEffect(() => {
    fetchTicker().then(d => setTicker(d)).catch(() => {});
  }, []);
  const isUp = ticker.change_pct >= 0;
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, minHeight:32 }}>
      {onBack
        ? <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:C.ink2,
            display:"flex", alignItems:"center", gap:8, fontSize:12.5, fontFamily:FONT, fontWeight:500, padding:0 }}>
            <ArrowLeft size={16} /> Back
          </button>
        : <span style={{ fontSize:11, letterSpacing:".18em", color:C.faint, fontWeight:600, textTransform:"uppercase" }}>{dateLabel}</span>}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px", background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radPill, fontSize:11, fontWeight:500 }}>
        <span style={{ fontFamily:DISP, fontWeight:600, fontSize:11, color:C.ink, letterSpacing:".02em" }}>NYSE: UPS</span>
        <span style={{ width:1, height:14, background:C.line2 }} />
        <span style={{ fontFamily:DISP, fontWeight:600, fontSize:11, color:C.ink }}>${ticker.price}</span>
        <span style={{ fontSize:10, fontWeight:600, color:isUp ? C.green : C.red }}>{isUp ? "▲" : "▼"} {Math.abs(ticker.change_pct)}%</span>
        {ticker.trade_date && <>
          <span style={{ width:1, height:14, background:C.line2 }} />
          <span style={{ fontSize:9.5, color:C.faint, letterSpacing:".02em" }}>Closed: {ticker.trade_date}</span>
        </>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ PULSE FLIP SECTION — entire Commercial Pulse card flips across 3 periods */
const PULSE_PERIODS = [
  { key:"prev",    label:"Q1 FY26",     subtitle:"Previous Quarter · Actuals vs Target",   chip:"" },
  { key:"current", label:"Q2 FY26",     subtitle:"Current Quarter · Actuals vs Target", chip:"" },
  { key:"fy27",    label:"FY27 Full Year", subtitle:"Annual · Actuals vs Target",           chip:"" },
];

function PulseFaceContent({ pulse, periodIdx }) {
  const period = PULSE_PERIODS[periodIdx];
  return (
    <>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:T.goldFoil }} />
      <div style={{ marginBottom:18, paddingRight:160 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Commercial Pulse</span>
          <span style={{ fontSize:8.5, letterSpacing:".22em", color:C.muted, fontWeight:600, textTransform:"uppercase", padding:"3px 8px", border:`1px solid ${C.line2}`, borderRadius:999 }}>{period.label}</span>
        </div>
        <div style={{ display:"flex", alignItems:"baseline", gap:14, flexWrap:"wrap" }}>
          <div style={{ fontFamily:DISP, fontWeight:600, fontSize:18, color:C.ink, letterSpacing:"-.01em" }}>{period.subtitle}</div>
          <div style={{ fontSize:10, color:C.faint, letterSpacing:".18em", fontWeight:600, textTransform:"uppercase" }}>{period.chip}</div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0, 1fr))", gap:20 }}>
        {pulse.map((p, i) => {
          const f = p.faces[periodIdx];
          return (
            <div key={i} style={{ paddingLeft: i > 0 ? 20 : 0, borderLeft: i > 0 ? `1px solid ${C.line}` : "none", minWidth:0 }}>
              <div style={{ fontSize:9.5, letterSpacing:".18em", color:C.muted, fontWeight:700, textTransform:"uppercase", marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.label}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                <span style={{ fontFamily:DISP, fontWeight:600, fontSize:26, color:C.ink, letterSpacing:"-.02em", lineHeight:1.15 }}>{f.actual}</span>
                <span style={{ fontSize:8.5, letterSpacing:".18em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", padding:"2px 6px", border:`1px solid ${C.line2}`, borderRadius:999, lineHeight:1.2 }}>{f.note}</span>
              </div>
              <div style={{ fontSize:10.5, color:C.muted, marginBottom:6, lineHeight:1.4, wordBreak:"break-word" }}>
                Target <span style={{ color:C.ink, fontWeight:600 }}>{f.target}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color: f.up ? C.green : C.red, wordBreak:"break-word" }}>
                <span style={{ flexShrink:0 }}>{f.up ? "▲" : "▼"}</span>
                <span>{f.delta}</span>
              </div>
              <div style={{ fontSize:9, color:C.faint, marginTop:10, letterSpacing:".05em", fontStyle:"italic", lineHeight:1.4, wordBreak:"break-word" }}>Source: {p.src}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function PulseFlipSection({ pulse }) {
  /* Two physical slots (slotA front, slotB back). Each holds a period.
     activeSlot tracks which is currently facing viewer.
     Flip: load NEXT period into inactive slot, then rotate container 180.
     This way backface-visibility hides the outgoing slot and the incoming slot is already correctly oriented — no mirrored content. */
  const [activeSlot, setActiveSlot] = useState("A");        // "A" or "B"
  const [slotAIdx, setSlotAIdx] = useState(1);              // period in slot A
  const [slotBIdx, setSlotBIdx] = useState(0);              // period in slot B (preload prev period)
  const [rotation, setRotation] = useState(0);              // accumulating rotation
  const [flipping, setFlipping] = useState(false);
  const timersRef = React.useRef([]);

  React.useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  const activeIdx = activeSlot === "A" ? slotAIdx : slotBIdx;

  const goTo = (nextIdx) => {
    if (flipping || nextIdx === activeIdx) return;
    setFlipping(true);
    // Load incoming period into the inactive slot
    if (activeSlot === "A") setSlotBIdx(nextIdx);
    else setSlotAIdx(nextIdx);
    // Defer rotation by one frame so DOM commits new slot content before flip starts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRotation((r) => r + 180);
        setActiveSlot((s) => (s === "A" ? "B" : "A"));
      });
    });
    const t = setTimeout(() => setFlipping(false), 620);
    timersRef.current.push(t);
  };

  const cycle = () => goTo((activeIdx + 1) % PULSE_PERIODS.length);
  const prev = (e) => { e.stopPropagation(); goTo((activeIdx - 1 + PULSE_PERIODS.length) % PULSE_PERIODS.length); };
  const next = (e) => { e.stopPropagation(); goTo((activeIdx + 1) % PULSE_PERIODS.length); };
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycle(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); goTo((activeIdx + 1) % PULSE_PERIODS.length); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo((activeIdx - 1 + PULSE_PERIODS.length) % PULSE_PERIODS.length); }
  };

  const navBtn = (label, onClick, ariaLabel) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width:26, height:26, borderRadius:999, border:`1px solid ${C.line2}`, background:T.cardElevated,
        cursor:"pointer", display:"grid", placeItems:"center", color:C.ink, fontSize:12, fontWeight:700,
        transition:`background .15s ${T.ease}, border-color .15s ${T.ease}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${C.gold}18`; e.currentTarget.style.borderColor = C.gold; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = T.cardElevated; e.currentTarget.style.borderColor = C.line2; }}
    >{label}</button>
  );

  const faceBase = {
    gridArea: "stack",
    width: "100%",
    background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg,
    padding:"22px 28px", boxShadow:T.shadow2,
    position:"relative",
    backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden",
  };

  return (
    <div style={{ position:"relative", perspective:"1800px", marginBottom:32 }}>
      <div
        onClick={cycle}
        onKeyDown={onKey}
        tabIndex={0}
        role="button"
        aria-label={`Commercial Pulse — ${PULSE_PERIODS[activeIdx].label}. Click to flip to next period.`}
        aria-live="polite"
        style={{
          position:"relative", width:"100%",
          display:"grid", gridTemplateAreas:`"stack"`,
          cursor:"pointer", outline:"none",
          transformStyle:"preserve-3d",
          transform:`rotateX(${rotation}deg)`,
          transition:`transform .6s ${T.ease}`,
        }}
      >
        {/* Slot A — front, rotateX 0 */}
        <div style={{ ...faceBase, transform:"rotateX(0deg)" }}>
          <PulseFaceContent pulse={pulse} periodIdx={slotAIdx} />
        </div>
        {/* Slot B — back, rotateX 180 so its content reads correctly when container reaches 180 */}
        <div style={{ ...faceBase, transform:"rotateX(180deg)" }}>
          <PulseFaceContent pulse={pulse} periodIdx={slotBIdx} />
        </div>
      </div>

      {/* Nav controls — OUTSIDE the rotating element so they never flip */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position:"absolute", top:22, right:28, display:"flex", alignItems:"center", gap:6, zIndex:10 }}
      >
        {navBtn("‹", prev, "Previous period")}
        <div style={{ display:"flex", gap:5, padding:"0 4px", alignItems:"center" }}>
          {PULSE_PERIODS.map((p, di) => (
            <button
              key={p.key}
              onClick={(e) => { e.stopPropagation(); goTo(di); }}
              aria-label={`Show ${p.label}`}
              style={{
                width: di === activeIdx ? 18 : 7, height:7, borderRadius:999, border:"none",
                background: di === activeIdx ? C.gold : C.line2, cursor:"pointer", padding:0,
                transition:`width .25s ${T.ease}, background .2s ${T.ease}`,
              }}
            />
          ))}
        </div>
        {navBtn("›", next, "Next period")}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ HOME — editorial executive brief */
function HomeView({ go, onOpenChat, chatOpen, onSignalChat }) {
  const [attention, setAttention] = useState([]);
  const [loadingAttention, setLoadingAttention] = useState(true);

  React.useEffect(() => {
    setLoadingAttention(true);
    fetchAttention(1, "all").then(items => { setAttention(items); setLoadingAttention(false); }).catch(e => { console.error(e); setLoadingAttention(false); });
  }, []);

  const greeting = (() => {
    const h = estNow().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  /* PULSE — 3-face flip cards. Q4 FY25 (Previous) · Q1 FY26 (Current) · FY27 Target.
     All data from UPS SEC filings (8-K). Q4 2025: Jan 27 2026. Q1 2026: Apr 28 2026.
     FY2026 guidance reaffirmed Apr 28 2026. */
  const PULSE = [
    {
      label: "Revenue",
      src: "UPS 8-K, SEC EDGAR",
      faces: [
        { period: "Q1 FY26",     target: "$22.4B",    actual: "$21.2B",   note: "Actual",  delta: "−$1.2B (−5.4%)",             up: false },
        { period: "Q2 FY26",     target: "$22.4B",    actual: "~$20.6B",  note: "QTD",     delta: "On pace ~$21.2B run-rate",   up: false },
        { period: "FY27 Target", target: "~$89.7B",   actual: "$84.8B",   note: "Run-rate", delta: "−$4.9B (−5.5%) H2 recovery critical", up: false },
      ],
    },
    {
      label: "RPP",
      src: "UPS 8-K Exhibit 99.2",
      faces: [
        { period: "Q1 FY26",     target: "~$14.80",    actual: "$15.32",   note: "Actual",  delta: "+$0.52 (+6.5% YoY)",         up: true  },
        { period: "Q2 FY26",     target: "~$14.90",    actual: "~$14.90",  note: "QTD",     delta: "+3.9% YoY run-rate",         up: true  },
        { period: "FY27 Target", target: "~$16.60–17.00", actual: "$15.32", note: "Run-rate", delta: "Behind FY pace (Q1 low)",  up: false },
      ],
    },
    {
      label: "Op Margin",
      src: "UPS 8-K, Non-GAAP Adj.",
      faces: [
        { period: "Q1 FY26",     target: "~8.2%",     actual: "6.2%",     note: "Non-GAAP Adj.",  delta: "−1.9pp YoY (transition qtr)",    up: false },
        { period: "Q2 FY26",     target: "~7.5–8.5%", actual: "~7.0%",    note: "QTD",     delta: "+0.8pp from Q1",             up: true  },
        { period: "FY27 Target", target: "~9.6%",      actual: "6.2%",    note: "Run-rate", delta: "−3.4pp H2 expansion critical", up: false },
      ],
    },
    {
      label: "ADV",
      src: "UPS 8-K Exhibit 99.2",
      faces: [
        { period: "Q1 FY26",     target: "~19,900K",   actual: "19,184K",   note: "Actual",  delta: "−716 K (−3.6%)",               up: false },
        { period: "Q2 FY26",     target: "~18,750K",    actual: "~18,700K",  note: "QTD",     delta: "On track within range",      up: true  },
        { period: "FY27 Target", target: "~21,100K–21,800K", actual: "19,184K", note: "Run-rate", delta: "Below target, H2 recovery critical", up: false },
      ],
    },
  ];

  const sigIcon = {
    "Override": AlertTriangle, "Competitor": Shield, "RFP": Target, "Earnings": BarChart3,
    "Healthcare": HeartPulse, "M&A": Briefcase, "Tariff": Globe, "Volume": Truck,
    "Network": Activity, "Production": Activity, "Plant": Activity, "Exec Move": Users,
    "Account": Building2, "Fuel": Zap,
  };

  return (
    <div>
      <ShellTop />
      <CenterTitle />

      {/* Hero */}
      <div style={{ marginBottom:40 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:14, marginBottom:8 }}>
          <span style={{ fontFamily:DISP, fontWeight:600, fontSize:42, color:C.ink, letterSpacing:"-.02em", lineHeight:1.05 }}>
            {greeting}, <span style={{ fontStyle:"italic", fontWeight:500, color:C.goldDk }}>Matt.</span>
          </span>
        </div>
        <div style={{ fontSize:14.5, color:C.muted, maxWidth:680, lineHeight:1.6, fontWeight:400 }}>
          {attention.length || 0} signals need your attention this {estNow().getHours() < 12 ? "morning" : estNow().getHours() < 18 ? "afternoon" : "evening"}.
        </div>
      </div>

      {/* Commercial pulse strip — single card flips across Q4 FY25 · Q1 FY26 · FY27 Target */}
      <PulseFlipSection pulse={PULSE} />

      {/* Section header — Today's Focus */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${C.line}` }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ width:20, height:1, background:T.goldFoil }} />
            <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Today's Focus · Live monitoring</span>
          </div>
          <div style={{ fontFamily:DISP, fontWeight:600, fontSize:26, color:C.ink, letterSpacing:"-.01em" }}>What needs your attention</div>
        </div>
        <div style={{ fontSize:10.5, color:C.faint, letterSpacing:".14em", fontWeight:600, textTransform:"uppercase" }}>{attention.length} active · prioritised</div>
      </div>

      {(() => {
        const SignalStoryCard = ({ c, i }) => {
          const Icon = sigIcon[c.signal_type] || AlertTriangle;
          const ribbonColor = c.tone === "green" ? C.green : c.tone === "urgent" ? C.red : C.amber;
          const ribbonBg = c.tone === "green" ? C.greenBg : c.tone === "urgent" ? C.redBg : C.amberBg;
          return (
            <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg,
              padding:"20px 20px", display:"flex", flexDirection:"column", boxShadow:T.shadow1, position:"relative", overflow:"hidden",
              transition:`transform .25s ${T.ease}, box-shadow .25s ${T.ease}` }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadow2; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow1; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:ribbonColor }} />
              {/* Category + strategy tag */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, marginTop:2 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", padding:"3px 8px", borderRadius:T.radSm,
                    background:ribbonBg, color:ribbonColor }}>{c.signal_type || "Signal"}</span>
                  {/* <span style={{ fontSize:9, fontWeight:600, color:C.faint, letterSpacing:".06em" }}>CCO action</span> */}
                </div>
                {c.strategy_tag && <span style={{ fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:T.radPill, letterSpacing:".08em", textTransform:"uppercase",
                  color: c.strategy_tag === "Grow" ? C.green : c.strategy_tag === "Retain" ? C.amber : C.goldDk,
                  background: c.strategy_tag === "Grow" ? C.greenBg : c.strategy_tag === "Retain" ? C.amberBg : `${C.gold}15`,
                  border:`1px solid ${c.strategy_tag === "Grow" ? `${C.green}33` : c.strategy_tag === "Retain" ? `${C.amber}33` : `${C.gold}33`}` }}>{c.strategy_tag}</span>}
              </div>
              {/* Title */}
              <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:C.ink, marginBottom:10, lineHeight:1.3, letterSpacing:"-.005em" }}>
                {c.title}
              </div>
              {/* Recommended action */}
              <div style={{ fontSize:11.5, color:C.ink2, lineHeight:1.5, marginBottom:12, flex:1 }}>
                {c.recommended_action_summary || ""}
              </div>
              {/* Footer: source + delta */}
              <div style={{ borderTop:`1px solid ${C.line}`, paddingTop:12, marginTop:"auto", display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                  <span style={{ fontSize:10, color:C.faint }}>
                    {c.source}
                  </span>
                  {c.delta_value && (
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:T.radSm,
                      background: (c.delta_value.includes("-") || c.delta_value.includes("−")) ? `${C.red}12` : c.delta_value.includes("+") ? `${C.green}12` : `${C.goldDk}12`,
                      color: (c.delta_value.includes("-") || c.delta_value.includes("−")) ? C.red : c.delta_value.includes("+") ? C.green : C.goldDk,
                      letterSpacing:".04em", fontFamily:DISP, flexShrink:0 }}>{c.delta_value}</span>
                  )}
                </div>
                {/* CTA + Chat buttons */}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => go(c.cta_action, c)} style={{ background:C.brand, color:"#fff", border:`1px solid ${C.brand}`,
                    borderRadius:T.radMd, padding:"11px 16px", fontSize:11, fontWeight:700, cursor:"pointer", flex:1,
                    fontFamily:FONT, letterSpacing:".14em", textTransform:"uppercase",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    transition:`background .2s ${T.ease}` }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.ink; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.brand; }}>
                    <span>{c.cta_label || "Open"}</span>
                    <ArrowRight size={13} />
                  </button>
                  <button onClick={() => onSignalChat(c)} style={{ background:T.cardElevated, border:`1px solid ${C.line}`,
                    borderRadius:T.radMd, padding:"11px 14px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    transition:`all .2s ${T.ease}` }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = `${C.gold}10`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.background = T.cardElevated; }}>
                    <MessageCircle size={15} color={C.goldDk} />
                  </button>
                </div>
              </div>
            </div>
          );
        };

        if (loadingAttention) return <div style={{ textAlign:"center", padding:40, color:C.muted, fontSize:13 }}>Loading signals…</div>;
        if (attention.length === 0) return (
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"40px 24px", textAlign:"center", marginBottom:32, boxShadow:T.shadow1 }}>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:C.ink, marginBottom:6 }}>All clear</div>
            <div style={{ fontSize:12.5, color:C.muted }}>No signals currently require your attention.</div>
          </div>
        );

        return (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18, marginBottom:32 }}>
            {attention.map((c, i) => <SignalStoryCard key={c.id} c={c} i={i} />)}
          </div>
        );
      })()}

      <div style={{ marginBottom:40 }} />
    </div>
  );
}

/* ── Chat Interactive Components (CCO-themed) ── */
function SignalOptionCards({ options, onSelect }) {
  const [selectedId, setSelectedId] = useState(null);
  const handleSelect = (id, text) => { setSelectedId(id); setTimeout(() => onSelect(text), 500); };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:12 }}>
      {options.map((opt, i) => {
        if (selectedId && selectedId !== opt.id) return null;
        const isSel = selectedId === opt.id;
        return (
          <button key={opt.id || i} onClick={() => !selectedId && handleSelect(opt.id, opt.text)}
            style={{ background: isSel ? `${C.gold}14` : T.cardElevated, border:`1.5px solid ${isSel ? C.gold : C.line2}`, borderRadius:10,
              padding:"10px 12px", cursor: selectedId ? "default" : "pointer", textAlign:"left", fontFamily:FONT,
              transition:`all .2s ${T.ease}`, display:"flex", alignItems:"flex-start", gap:10, width:"100%",
              boxShadow: isSel ? `0 0 0 1px ${C.gold}40` : "0 1px 3px rgba(0,0,0,0.04)" }}
            onMouseEnter={e => { if (!selectedId) { e.currentTarget.style.borderColor = C.goldDk; e.currentTarget.style.background = `${C.gold}08`; e.currentTarget.style.boxShadow = `0 2px 8px ${C.gold}18`; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { if (!selectedId) { e.currentTarget.style.borderColor = C.line2; e.currentTarget.style.background = T.cardElevated; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; } }}>
            <div style={{ width:16, height:16, borderRadius:999, border:`2px solid ${isSel ? C.gold : C.line2}`,
              background: isSel ? C.gold : "transparent", display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, marginTop:1, transition:"all .2s ease" }}>
              {isSel && <div style={{ width:6, height:6, borderRadius:999, background:"#fff" }} />}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.ink, lineHeight:1.4 }}>{opt.text}</div>
              {opt.description && <div style={{ fontSize:10.5, color:C.muted, marginTop:3, lineHeight:1.4 }}>{opt.description}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SignalQuickReplyChips({ chips, onSelect }) {
  const [selectedId, setSelectedId] = useState(null);
  const handleSelect = (id, text) => { setSelectedId(id); setTimeout(() => onSelect(text), 300); };
  if (selectedId) return null;
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:12 }}>
      {chips.map((chip, i) => {
        const isSim = /simulat|decision lab/i.test(chip.text);
        return (
          <button key={chip.id || i} onClick={() => !selectedId && handleSelect(chip.id, chip.text)}
            style={isSim ? {
              padding:"11px 22px", borderRadius:T.radMd, background:T.goldFoil,
              border:"none", color:C.navBg, fontSize:13, fontWeight:700, cursor: selectedId ? "default" : "pointer",
              fontFamily:FONT, transition:`all .15s ${T.ease}`, letterSpacing:".02em",
              boxShadow:T.shadowGoldGlow, display:"inline-flex", alignItems:"center", gap:8, whiteSpace:"nowrap",
            } : {
              padding:"7px 12px", borderRadius:T.radPill, background:T.cardElevated,
              border:`1.5px solid ${C.line2}`, color:C.goldDk, fontSize:11, fontWeight:500,
              cursor: selectedId ? "default" : "pointer", fontFamily:FONT, transition:`all .2s ${T.ease}`,
              whiteSpace:"normal", textAlign:"left", lineHeight:1.3, maxWidth:"100%",
              boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={e => { if (!selectedId) { if (isSim) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = T.shadow2; e.currentTarget.style.background = C.navBg; e.currentTarget.style.color = C.paper; } else { e.currentTarget.style.background = `${C.gold}10`; e.currentTarget.style.borderColor = C.goldDk; e.currentTarget.style.boxShadow = `0 2px 6px ${C.gold}18`; } } }}
            onMouseLeave={e => { if (!selectedId) { if (isSim) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = T.shadowGoldGlow; e.currentTarget.style.background = T.goldFoil; e.currentTarget.style.color = C.navBg; } else { e.currentTarget.style.background = T.cardElevated; e.currentTarget.style.borderColor = C.line2; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; } } }}>
            {isSim && <Activity size={13} />}
            {chip.text}
          </button>
        );
      })}
    </div>
  );
}

function _parseOpts(text) {
  const decode = s => (s || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  const blocks = [...text.matchAll(/<options>([\s\S]*?)<\/options>/g)];

  // 0) Self-closing <options id="..." text="..." description="..."/> or <option .../> tags (no wrapper)
  if (!blocks.length) {
    const selfClosing = [...text.matchAll(/<option(?:s)?\s+[^>]*?id=["']([^"']*?)["'][^>]*?text=["']([^"']*?)["'][^>]*?(?:description=["']([^"']*?)["'][^>]*?)?\/?\s*>/g)];
    if (selfClosing.length > 0) {
      return selfClosing.map(m => ({ id: m[1], text: decode(m[2]), description: decode(m[3] || "") }));
    }
    // 0b) Bare <option id="..."> <text>...</text> <description>...</description> </option> without <options> wrapper
    const bareOptions = [...text.matchAll(/<option\s+[^>]*?id=["']([^"']*?)["'][^>]*?>([\s\S]*?)<\/option>/g)];
    if (bareOptions.length > 0) {
      const opts = [];
      for (const m of bareOptions) {
        const inner = m[2];
        const t = inner.match(/<text>([\s\S]*?)<\/text>/)?.[1]?.trim();
        const d = inner.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim();
        if (t) opts.push({ id: m[1], text: decode(t), description: decode(d || "") });
      }
      if (opts.length > 0) return opts;
    }
    return null;
  }
  // 1) JSON array: <options>[{...}]</options>
  if (blocks.length === 1) {
    const raw1 = blocks[0][1].trim();
    try { const a = JSON.parse(raw1); if (Array.isArray(a)) return a; } catch {}
    // 1b) Multiple JSON arrays/objects side by side: [{...}] [{...}] or {...} {...}
    const inlineObjs = [...raw1.matchAll(/(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g)].map(m => { try { return JSON.parse(m[1]); } catch { return null; } }).filter(Boolean);
    if (inlineObjs.length > 1 && inlineObjs[0].id) return inlineObjs;
  }
  const opts = [];
  for (const b of blocks) {
    const raw = b[1];
    // 2) Single JSON object per block
    try { const a = JSON.parse(raw.trim()); if (typeof a === "object" && a.id) { opts.push(a); continue; } } catch {}
    // 3) <option id="..." text="..." description="..."> attribute style
    const attrMatches = [...raw.matchAll(/<option\s+[^>]*?id=["']([^"']*?)["'][^>]*?text=["']([^"']*?)["'][^>]*?description=["']([^"']*?)["'][^>]*?>/gs)];
    if (attrMatches.length) {
      for (const am of attrMatches) {
        if (!opts.find(o => o.id === am[1])) opts.push({ id: am[1], text: decode(am[2]), description: decode(am[3]) });
      }
      continue;
    }
    // 4) <id>...</id><text>...</text><description>...</description> sub-element style
    const id = raw.match(/<id>(.*?)<\/id>/s)?.[1]?.trim();
    const t = raw.match(/<text>(.*?)<\/text>/s)?.[1]?.trim();
    const d = raw.match(/<description>(.*?)<\/description>/s)?.[1]?.trim();
    if (id && t && !opts.find(o => o.id === id)) opts.push({ id, text: decode(t), description: decode(d || "") });
  }
  return opts.length > 0 ? opts : null;
}

function _parseQR(text) {
  const blocks = [...text.matchAll(/<quick_replies>([\s\S]*?)<\/quick_replies>/g)];
  if (!blocks.length) return null;
  for (const b of blocks) {
    try { const a = JSON.parse(b[1].trim()); if (Array.isArray(a)) return a; } catch {}
  }
  const decode = s => (s || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  const opts = [];
  for (const b of blocks) {
    const raw = b[1];
    const attrMatches = [...raw.matchAll(/<quick_reply\s+[^>]*?id=["']([^"']*?)["'][^>]*?text=["']([^"']*?)["'][^>]*?>/gs)];
    for (const am of attrMatches) { if (!opts.find(o => o.id === am[1])) opts.push({ id: am[1], text: decode(am[2]) }); }
    const idMatch = raw.match(/<id>(.*?)<\/id>/s)?.[1]?.trim();
    const tMatch = raw.match(/<text>(.*?)<\/text>/s)?.[1]?.trim();
    if (idMatch && tMatch && !opts.find(o => o.id === idMatch)) opts.push({ id: idMatch, text: decode(tMatch) });
  }
  return opts.length > 0 ? opts : null;
}

function _parseSources(text) {
  const blocks = [...text.matchAll(/<sources>([\s\S]*?)<\/sources>/g)];
  if (!blocks.length) return null;
  for (const b of blocks) { try { return JSON.parse(b[1].trim()); } catch {} }
  return null;
}

function _stripTag(text, tag) {
  return text
    .replace(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, "g"), "")
    .replace(new RegExp(`<${tag}\\s+[^>]*?\\/?>`, "g"), "")
    .replace(new RegExp(`<\\/?${tag}>`, "g"), "");
}

function SourcesDisclosure({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources || (!sources.data_used?.length && !sources.reasoning)) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <button onClick={() => setOpen(!open)} style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: 10.5, color: C.muted, fontFamily: FONT,
        display: "flex", alignItems: "center", gap: 4,
        padding: "2px 0", opacity: 0.7, transition: "opacity .2s"
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
      onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}>
        <ChevronDown size={12} style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform .2s ease" }} />
        Sources & Reasoning
      </button>
      {open && (
        <div style={{ marginTop: 4, padding: "10px 12px", background: C.paper,
          border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 11, lineHeight: 1.5 }}>
          {sources.data_used?.length > 0 && (
            <>
              <div style={{ fontWeight: 600, color: C.muted, marginBottom: 4, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
                What I Used
              </div>
              {sources.data_used.map((d, i) => {
                const isInternal = /portfolio|account intel|account.*:|kpi|abm|market intelligence|signal|subsegment|pipeline|margin|enterprise|deal|key fact|internal/i.test(d.source);
                const isExternal = !isInternal;
                const tag = isExternal ? "External" : "Internal";
                return (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "baseline" }}>
                  <span style={{ color: C.ink2, lineHeight: 1.45 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase",
                      color: isExternal ? C.goldDk : C.muted,
                      background: isExternal ? `${C.gold}18` : `${C.muted}12`,
                      border: `1px solid ${isExternal ? `${C.gold}40` : `${C.muted}25`}`,
                      padding: "1.5px 6px", borderRadius: 3, marginRight: 6, display: "inline-block" }}>{tag}</span>
                    <strong style={{ color: C.ink }}>{d.source}</strong> — {d.detail}
                  </span>
                </div>
                );
              })}
            </>
          )}
          {sources.reasoning && (
            <>
              <div style={{ fontWeight: 600, color: C.muted, marginTop: 8, marginBottom: 4, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
                How I Reasoned
              </div>
              <div style={{ color: C.ink2 }}>{sources.reasoning}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SignalSkeletonOptions() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:10 }}>
      {[0,1].map(i => (
        <div key={i} style={{ border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:"9px 10px",
          height:38, animation:`sigChatPulse 1.8s ease-in-out ${i*0.15}s infinite` }}>
          <div style={{ width: i===0?"70%":"50%", height:10, background:`${C.gold}12`, borderRadius:3 }} />
          <div style={{ width: i===0?"90%":"70%", height:8, background:`${C.gold}08`, borderRadius:2, marginTop:5 }} />
        </div>
      ))}
      <style>{`@keyframes sigChatPulse { 0%,100%{opacity:0.4} 50%{opacity:0.7} }`}</style>
    </div>
  );
}

const THINK_PHRASES = [
  "Analysing signals", "Pulling portfolio data", "Cross-referencing accounts", "Connecting the dots",
  "Reviewing context", "Thinking", "Scanning market intelligence", "Checking account health",
  "Mapping competitive landscape", "Reading deal pipeline", "Evaluating margin trajectory",
  "Correlating KPIs", "Reviewing attention items",
];
function ThinkingIndicator() {
  const [order] = useState(() => [...THINK_PHRASES].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % order.length), 2200);
    return () => clearInterval(t);
  }, [order]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 4px" }}>
      <span style={{ fontSize:12, fontWeight:500, letterSpacing:".01em",
        background:`linear-gradient(90deg, ${C.goldDk}, ${C.gold}, ${C.goldDk})`,
        backgroundSize:"200% 100%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        animation:"sigThinkShimmer 2s linear infinite" }}>
        {order[idx]}
      </span>
      <span style={{ display:"flex", gap:3 }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ width:4, height:4, borderRadius:999, background:C.goldDk,
            animation:`sigChatBlink 1s ease-in-out ${i*0.2}s infinite` }} />
        ))}
      </span>
    </div>
  );
}

function SignalSkeletonChips() {
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
      {[80,100,70].map((w,i) => (
        <div key={i} style={{ height:26, width:w, borderRadius:T.radPill, background:`${C.gold}08`, border:`1px solid ${C.line}`,
          animation:`sigChatPulse 1.8s ease-in-out ${i*0.12}s infinite` }} />
      ))}
    </div>
  );
}

function HomeChatPill({ onSend }) {
  const { collapsed } = useSidebar();
  const sideW = collapsed ? 72 : 240;
  const [val, setVal] = useState("");
  const handleSubmit = () => { if (val.trim()) { onSend(val.trim()); setVal(""); } };
  return (
    <div style={{ position:"fixed", bottom:28, left:sideW + 14, right:0, zIndex:1050,
      display:"flex", justifyContent:"center", pointerEvents:"none",
      transition:`left .3s ${T.ease}` }}>
    <div style={{
      display:"flex", alignItems:"center", gap:8, background:C.card, border:`1px solid ${C.line2}`,
      borderRadius:T.radPill, padding:"8px 8px 8px 22px", width:"60%", maxWidth:720, pointerEvents:"auto",
      boxShadow:`0 4px 24px rgba(0,0,0,.12), 0 0 0 1px ${C.line}`,
      backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
      <MessageSquare size={15} color={C.goldDk} style={{ flexShrink:0 }} />
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
        placeholder="Ask your companion…"
        style={{ flex:1, border:"none", outline:"none", fontSize:13, fontFamily:FONT, color:C.ink, background:"transparent", padding:"6px 0", minWidth:0 }} />
      <button onClick={handleSubmit}
        style={{ background:T.goldFoil, color:C.navBg, border:"none", borderRadius:T.radPill,
          padding:"8px 16px", fontSize:10.5, fontWeight:700, cursor:"pointer", fontFamily:FONT,
          letterSpacing:".08em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:5, flexShrink:0,
          boxShadow:T.shadowGoldGlow }}>
        <Send size={12} /> Ask
      </button>
    </div>
    </div>
  );
}

/* ------------------------------------------------------------------ INVESTIGATE */
function InvestigateView({ go, attention, onSessionUpdate }) {
  const toast = useToast();
  const [investigateSessionId, setInvestigateSessionId] = useState(null);

  /* Default context — fallback when no attention payload */
  const DEFAULT_CONTEXT = {
    title: "Q2 SMB backfill pacing",
    seed_question: "Why is SMB backfill pacing behind if revenue per piece is still climbing?",
    ai_response: "The gap is concentrated in **newly acquired accounts**, not your installed base. 90-day revenue retention is down **−9.6%**, first-90-day ship frequency is **−11.4%** below plan, and digital-acquired accounts convert to repeat shippers at a lower rate than historical cohorts.\n\nThe strongest likely drivers are **onboarding friction**, **lower-quality acquisition**, and a crowded competitive pricing window. Installed-base yield remains strong, so a broad demand collapse is unlikely.",
    kpis: RECOVERY_TILES.map(t => ({ label:t.label, val:t.val, sub:t.note, neg:t.neg })),
    follow_ups: [
      "Which acquisition channels have the worst retention?",
      "What's the competitive pricing landscape doing?",
      "Show me onboarding completion rates by cohort",
      "How does CAC compare across paid vs organic channels?",
    ],
    affected_accounts: [],
    context_summary: "Commercial signal · SMB backfill gap",
    recommended_action: "",
    signal_type: "Volume",
    source: "UPS Q1 2026 Earnings Call",
    delta_value: "−4.8% vs plan",
    impact: "high",
  };

  /* Resolve active context from attention payload or fall back to default */
  const ctx = React.useMemo(() => {
    if (attention && attention.investigation_payload) {
      return {
        title: attention.title,
        seed_question: attention.investigation_payload.seed_question || attention.title,
        ai_response: attention.investigation_payload.ai_response || attention.body,
        kpis: attention.investigation_payload.kpis || [],
        follow_ups: attention.investigation_payload.follow_ups || [],
        affected_accounts: attention.investigation_payload.affected_accounts || (attention.related_account ? [attention.related_account] : []),
        context_summary: attention.investigation_payload.context_summary || attention.tag,
        recommended_action: attention.investigation_payload.recommended_action || "",
        right_panel_views: attention.investigation_payload.right_panel_views || [],
        default_analytics: attention.investigation_payload.default_analytics || null,
        signal_type: attention.signal_type,
        source: attention.source,
        delta_value: attention.delta_value,
        impact: attention.impact,
        attention_id: attention.id,
      };
    }
    return DEFAULT_CONTEXT;
  }, [attention]);

  const initialMessages = React.useMemo(() => {
    const baseCharts = ctx.kpis.length === 0
      ? [{ type:"bar", title:"New vs Installed-Base Account Health", data:COHORT, keys:[{key:"base",name:"Installed base",color:C.brandLt},{key:"neu",name:"New (last 90d)",color:C.gold}], xKey:"period" }]
      : [];
    return [
      { role:"user", text: ctx.seed_question, time: fmtTime() },
      { role:"ai", text: ctx.ai_response, time: fmtTime(), charts: baseCharts },
    ];
  }, [ctx]);

  const [messages, setMessages] = useState(() => [
    { role:"user", text: initialMessages[0].text, time: initialMessages[0].time },
    { role:"ai", text: "", time: initialMessages[1].time, charts: initialMessages[1].charts },
  ]);
  const streamedInitial = useRef(false);
  useEffect(() => {
    if (streamedInitial.current) return;
    streamedInitial.current = true;
    const full = initialMessages[1].text;
    let i = 0;
    const tick = () => {
      const step = Math.min(full.length - i, Math.floor(Math.random() * 4) + 2);
      i += step;
      setMessages(prev => {
        const next = [...prev];
        next[1] = { ...next[1], text: full.slice(0, i) };
        return next;
      });
      if (i < full.length) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [initialMessages]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState(0);
  const rightPanelRef = useRef(null);
  const chatVoice = useVoiceInput((t) => setInput(prev => prev ? prev + " " + t : t));
  const [rightPanelView, setRightPanelView] = useState(attention?._openInvitePanel ? "invite-team" : "analytics");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [groupStarted, setGroupStarted] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState({});
  const chatEndRef = React.useRef(null);

  React.useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const rightPanelViews = ctx.right_panel_views || [];
  const activeRightView = rightPanelViews.find(v => v.key === rightPanelView);

  const rawFollowUps = ctx.follow_ups || [];
  const FOLLOW_UPS = rawFollowUps.map(f => typeof f === "string" ? { type:"chat", label:f, prompt:f } : f);

  const generateCharts = (text) => {
    const charts = [];
    const lower = text.toLowerCase();
    if (lower.includes("channel") || lower.includes("acquisition") || lower.includes("cac")) {
      charts.push({ type: "bar", title: "CAC by Acquisition Channel", data: [
        { channel: "Paid Search", cac: 342, retention: 61 }, { channel: "Social Ads", cac: 289, retention: 54 },
        { channel: "Field Sales", cac: 518, retention: 78 }, { channel: "DAP (Digital)", cac: 186, retention: 72 },
        { channel: "Referral", cac: 124, retention: 84 }, { channel: "Marketplace", cac: 205, retention: 69 },
      ], keys: [{ key: "cac", name: "CAC ($)", color: C.red }, { key: "retention", name: "90-day Retention (%)", color: C.green }], xKey: "channel" });
    }
    if (lower.includes("pricing") || lower.includes("competitive") || lower.includes("market")) {
      charts.push({ type: "line", title: "Competitive Pricing Index — SMB Segment", data: [
        { month: "Jan", ups: 100, fedex: 98, dhl: 95 }, { month: "Feb", ups: 101, fedex: 97, dhl: 94 },
        { month: "Mar", ups: 102, fedex: 95, dhl: 93 }, { month: "Apr", ups: 103, fedex: 93, dhl: 92 },
        { month: "May", ups: 103, fedex: 91, dhl: 91 },
      ], keys: [{ key: "ups", name: "UPS", color: C.brand }, { key: "fedex", name: "FedEx", color: "#4d148c" }, { key: "dhl", name: "DHL", color: "#d40511" }], xKey: "month" });
    }
    if (lower.includes("onboarding") || lower.includes("cohort") || lower.includes("retention")) {
      charts.push({ type: "area", title: "Onboarding Completion by Cohort Week", data: [
        { week: "W1", q1: 92, q2: 88, current: 79 }, { week: "W2", q1: 84, q2: 78, current: 65 },
        { week: "W4", q1: 76, q2: 68, current: 52 }, { week: "W8", q1: 71, q2: 62, current: 44 },
        { week: "W12", q1: 68, q2: 58, current: 38 },
      ], keys: [{ key: "q1", name: "Q1 Cohort", color: C.green }, { key: "q2", name: "Q2 Cohort", color: C.gold }, { key: "current", name: "Current", color: C.red }], xKey: "week" });
    }
    if (charts.length === 0) {
      charts.push({ type: "bar", title: "SMB Revenue Recovery Metrics", data: [
        { metric: "Rev vs Plan", value: -4.8 }, { metric: "Base Yield", value: 3.2 },
        { metric: "New Retention", value: -9.6 }, { metric: "Ship Freq", value: -11.4 },
        { metric: "Onboarding", value: -6.2 }, { metric: "Win Rate", value: -3.1 },
      ], keys: [{ key: "value", name: "% Change QoQ", color: C.gold }], xKey: "metric" });
    }
    return charts;
  };

  const generateExplanation = (query) => {
    const lower = query.toLowerCase();
    if (lower.includes("channel") || lower.includes("acquisition") || lower.includes("cac")) {
      return `### Acquisition Channel Breakdown\n\nLooking at CAC and 90-day retention across all active channels:\n\n- **Paid Search** is the most expensive at **$342/account** with only **61% retention** — worst ROI in the portfolio\n- **Social Ads** run cheaper at **$289** but retention drops to **54%**, meaning more than half of acquired accounts churn within 90 days\n- **Field Sales** costs **$518** but delivers **78% retention** — expensive upfront but sticky long-term\n- **DAP (Digital Access)** is the standout: **$186/account** with **72% retention** — best efficiency by far\n- **Referral** at **$124** and **84% retention** is ideal but has limited scale\n\n**Key takeaway:** UPS is over-indexing on paid digital channels that produce low-retention accounts. Shifting **15-20% of paid search budget to DAP** could save ~$2.1M/quarter while improving account quality.\n\n**Recommendation:** Reallocate budget from Paid Search → DAP, and pilot a referral incentive program to scale the highest-quality channel.`;
    }
    if (lower.includes("pricing") || lower.includes("competitive") || lower.includes("market")) {
      return `### Competitive Pricing Landscape\n\nThe SMB ground shipping market is experiencing significant competitive pressure:\n\n- **FedEx** cut SMB ground rates **3.2% in Q2**, directly targeting UPS's mid-tier accounts ($5K-$25K/month)\n- **DHL** is expanding domestic SMB presence with aggressive onboarding credits and waived surcharges for first 90 days\n- **Regional carriers** (OnTrac, LSO, Spee-Dee) are gaining share in **6 metro areas** with same-day capabilities\n\n**UPS pricing index sits at 103** vs FedEx at **91** — the widest gap in 8 quarters. This premium was sustainable when service differentiation was clear, but FedEx's service parity improvements are eroding that advantage.\n\n**The risk:** Price-matching alone won't close the gap — it would cost ~$180M annually. Instead, the competitive response should focus on **service bundling** (guaranteed delivery windows + returns integration) and **DAP stickiness** (technology lock-in through API integration).\n\n**Watch:** FedEx's Q3 rate announcement expected mid-July could widen the gap further.`;
    }
    if (lower.includes("onboarding") || lower.includes("cohort") || lower.includes("retention")) {
      return `### Onboarding & Cohort Analysis\n\nOnboarding completion is the single biggest driver of long-term account retention, and current cohorts are significantly underperforming:\n\n- **Current cohort:** Only **38%** complete full onboarding by Week 12 vs **68%** historical benchmark\n- **Drop-off inflection point:** Week 2-4, where completion falls from 65% → 52% — this is where we lose most accounts\n- **Q1 cohort** (our best recent) held **68%** at Week 12; **Q2 cohort** dropped to **58%**; current is **38%**\n\n**Root causes identified:**\n1. **Shipping label setup friction** — 31% of drop-offs cite complexity in first shipment\n2. **No dedicated onboarding contact** for accounts under $10K/month\n3. **Delayed API credential provisioning** — average 4.2 days vs competitor average of <1 day\n\n**Impact math:** Every 10pp improvement in onboarding completion = ~$42M in retained annual revenue. Getting back to the Q1 benchmark of 68% would recover **$126M/year**.\n\n**Quick wins:** Simplify first-shipment flow, auto-provision API keys at signup, add Week 1 check-in call for accounts >$5K.`;
    }
    if (lower.includes("lever") || lower.includes("close") || lower.includes("gap") || lower.includes("fix") || lower.includes("plan") || lower.includes("recovery")) {
      return `### Gap Closure Levers\n\nTo close the SMB backfill gap, five levers have the highest expected impact:\n\n1. **Shift DAP allocation +20%** — Redirect $4.2M from paid search to Digital Access Program. Expected savings: **~$2.1M/quarter** on CAC with higher retention accounts\n\n2. **Onboarding acceleration program** — Dedicated onboarding specialist for first 14 days. Target: improve 90-day retention from **38% → 55%** (+$42M annual revenue)\n\n3. **SMB loyalty tier pricing** — Introduce volume-based rate locks at 6-month mark to reduce churn on established accounts. Expected retention lift: **+8pp**\n\n4. **Landing page CRO sprint** — Current paid search conversion is **2.8%**, industry benchmark is **4.1%**. A/B testing program could close this in 6-8 weeks\n\n5. **Field sales territory optimization** — 3 territories have CAC >$600 with <60% retention. Reassign or restructure these to reduce drag on overall portfolio\n\n**Combined estimated gap closure: 62-68%** over 2 quarters. Total investment: ~$8M. Expected return: ~$180M in retained/new annual revenue.\n\n**Sequencing:** Start with DAP reallocation (Week 1) and onboarding fix (Week 2) — these are lowest cost, highest confidence.`;
    }
    if (lower.includes("sentiment") || lower.includes("nps") || lower.includes("customer") || lower.includes("satisfaction")) {
      return `### Customer Sentiment Analysis\n\nNew-customer sentiment has deteriorated across multiple channels:\n\n- **NPS for new accounts (0-90 days):** Dropped from **+32 → +18** QoQ, driven by onboarding friction\n- **Support ticket volume:** Up **22%** for accounts in first 30 days, with "billing confusion" and "label setup" as top categories\n- **Social sentiment:** Negative mentions up **14%** on small business forums and Reddit, primarily around pricing transparency\n- **Installed-base NPS** remains stable at **+41** — the issue is isolated to new accounts\n\n**Key driver:** The gap between marketing promise and actual onboarding experience. Paid digital campaigns promote "ship in minutes" but actual time-to-first-shipment averages **3.2 days** due to credential provisioning delays.\n\n**Recommended actions:**\n1. Align marketing messaging with realistic onboarding timelines\n2. Add self-service troubleshooting for top 5 support ticket categories\n3. Proactive outreach at Day 3 and Day 14 for at-risk accounts`;
    }
    return `### Analysis: ${query}\n\nHere's what the data shows across the key dimensions of this signal:\n\n- **SMB acquisition cost** trending **+7.8% QoQ** across paid digital and field sales — the two largest motions in the portfolio\n- **Quote-to-close recovery** remains weak at **+0.9% QoQ** — cost is outpacing funnel improvement by nearly 8:1\n- **Digital-attributed (DAP) channels** now beating paid digital on a $/new-account basis (**$186 vs $342**), suggesting a structural shift in channel economics\n- **90-day revenue retention** for new accounts down **9.6%** — the problem isn't demand, it's account quality and activation\n- **Onboarding completion** at **38%** vs **68%** historical benchmark, with the biggest drop-off at Week 2-4\n\n**What this means for the SMB backfill plan:** The current trajectory puts the network-fill target at risk as Amazon volume exits. The gap isn't about total account acquisition — it's about acquiring the *right* accounts through the *right* channels and activating them fast enough to generate repeat shipping behavior.\n\n**Three things to focus on:**\n1. Channel mix rebalancing (DAP > Paid Search)\n2. Onboarding acceleration (target Week 2-4 drop-off)\n3. Retention mechanics for accounts past 90 days`;
  };

  const signalContextRef = React.useMemo(() => {
    const kpiLines = (ctx.kpis || []).map(t => `- ${t.label}: ${t.val} (${t.sub})`).join("\n");
    const accountLines = (ctx.affected_accounts || []).map(a => `- ${a}`).join("\n");
    const analyticsTables = (ctx.default_analytics?.tables || []).map(tbl =>
      `[TABLE: ${tbl.title}]\nColumns: ${tbl.columns.join(" | ")}\n${tbl.rows.map(r => r.join(" | ")).join("\n")}`
    ).join("\n\n");
    const rightPanelSummaries = (ctx.right_panel_views || []).filter(v => v.key !== "invite-team").map(v =>
      `[VIEW: ${v.label}] ${v.title} — ${v.subtitle}${v.metrics?.length ? "\nMetrics: " + v.metrics.map(m => `${m.label}: ${m.val} (${m.sub})`).join(", ") : ""}`
    ).join("\n\n");

    return `[SIGNAL]
Title: ${ctx.title}
Type: ${ctx.signal_type || "N/A"}
Source: ${ctx.source || "Internal"}
Impact: ${ctx.impact || "med"} · Delta: ${ctx.delta_value || "—"}

[CONTEXT SUMMARY]
${ctx.context_summary || ""}

[INITIAL AI READOUT]
${ctx.ai_response}

[KEY KPIs]
${kpiLines || "(none)"}

[AFFECTED STRATEGIC ACCOUNTS]
${accountLines || "(none)"}

[RECOMMENDED ACTION]
${ctx.recommended_action || "(none)"}

[ANALYTICS DATA]
${analyticsTables || "(none)"}

[AVAILABLE INVESTIGATION VIEWS]
${rightPanelSummaries || "(none)"}`;
  }, [ctx]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input, time: fmtTime() };
    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput(""); setLoading(true);
    const fallbackText = generateExplanation(query);
    const history = messages.map(m => ({ role: m.role === "ai" ? "model" : "user", text: m.text }));
    const aiMsg = { role: "ai", text: "", time: fmtTime() };
    setMessages(prev => [...prev, aiMsg]);
    setActiveChart(0);
    let streamed = "";
    let rafPending = false;
    const flushText = () => { rafPending = false; setMessages(prev => { const next = [...prev]; next[next.length - 1] = { ...next[next.length - 1], text: streamed }; return next; }); };
    try {
      await chatWithAgentStream(query, {
        history, signal_context: signalContextRef, session_id: investigateSessionId,
        onChunk: (chunk) => {
          streamed += chunk;
          if (!rafPending) { rafPending = true; requestAnimationFrame(flushText); }
        },
        onSession: (sid) => { setInvestigateSessionId(sid); onSessionUpdate?.(); },
        onDone: () => {
          flushText();
          if (streamed.length < 30) {
            setMessages(prev => { const next = [...prev]; next[next.length - 1] = { ...next[next.length - 1], text: fallbackText }; return next; });
          }
        },
        onError: () => {
          setMessages(prev => { const next = [...prev]; next[next.length - 1] = { ...next[next.length - 1], text: fallbackText }; return next; });
        },
      });
    } catch {
      if (!streamed) setMessages(prev => { const next = [...prev]; next[next.length - 1] = { ...next[next.length - 1], text: fallbackText }; return next; });
    }
    setLoading(false);
  };

  const latestCharts = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].charts?.length) return messages[i].charts;
    }
    return [{ type: "bar", title: "New vs Installed-Base Account Health", data: COHORT, keys: [{ key: "base", name: "Installed base", color: C.brandLt }, { key: "neu", name: "New (last 90d)", color: C.gold }], xKey: "period" }];
  }, [messages]);

  const renderChart = (chart) => {
    if (chart.type === "bar") return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chart.data} barGap={4} margin={{ top: 10, right: 6, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
          <XAxis dataKey={chart.xKey} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
          {chart.keys.map(k => <Bar key={k.key} dataKey={k.key} name={k.name} fill={k.color} radius={[3, 3, 0, 0]} maxBarSize={24} />)}
        </BarChart>
      </ResponsiveContainer>
    );
    if (chart.type === "line") return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chart.data} margin={{ top: 10, right: 6, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
          <XAxis dataKey={chart.xKey} tick={{ fontSize: 10, fill: C.muted }} />
          <YAxis tick={{ fontSize: 10, fill: C.faint }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
          {chart.keys.map(k => <Line key={k.key} type="monotone" dataKey={k.key} name={k.name} stroke={k.color} strokeWidth={2} dot={{ r: 3, fill: k.color }} />)}
        </LineChart>
      </ResponsiveContainer>
    );
    if (chart.type === "area") return (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chart.data} margin={{ top: 10, right: 6, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
          <XAxis dataKey={chart.xKey} tick={{ fontSize: 10, fill: C.muted }} />
          <YAxis tick={{ fontSize: 10, fill: C.faint }} domain={[0, 100]} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
          {chart.keys.map(k => <Area key={k.key} type="monotone" dataKey={k.key} name={k.name} stroke={k.color} fill={`${k.color}18`} strokeWidth={2} />)}
        </AreaChart>
      </ResponsiveContainer>
    );
    return null;
  };

  const inviteOnly = !!attention?._openInvitePanel;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      <ShellTop onBack={() => go(inviteOnly ? "signalDetail" : "home")} />
      <div style={{ display: "grid", gridTemplateColumns: inviteOnly ? "1fr" : rightPanelOpen ? "1fr 1.2fr" : "1fr 42px", gap: rightPanelOpen ? 22 : 8, flex: 1, minHeight: 0, transition: "grid-template-columns .3s cubic-bezier(.4,0,.2,1)" }}>
        {/* Chat column */}
        {!inviteOnly && <div style={{ overflowY: "auto", paddingRight: 8, paddingBottom: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              {m.role === "user" ? (
                <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"16px 20px", boxShadow:T.shadow1 }}>
                  <div style={{ fontSize:10, color:C.faint, marginBottom:8, display:"flex", justifyContent:"space-between", letterSpacing:".14em", textTransform:"uppercase", fontWeight:600 }}>
                    <span>You</span><span>{m.time}</span>
                  </div>
                  <div style={{ fontSize:14.5, color:C.ink, fontWeight:500, lineHeight:1.55, letterSpacing:"-.005em" }}>{m.text}</div>
                </div>
              ) : (
                <div style={{ background:`${C.gold}06`, border:`1px solid ${C.gold}28`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:T.goldFoil }} />
                  <div style={{ fontSize:10, color:C.faint, marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center", letterSpacing:".14em", textTransform:"uppercase", fontWeight:600 }}>
                    <span style={{ color:C.goldDk, display:"flex", alignItems:"center", gap:6 }}><Sparkles size={11} /> Companion Analysis</span>
                    <span>{m.time}</span>
                  </div>
                  {!m.text && loading && i === messages.length - 1 ? (
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0" }}>
                      <Loader2 size={16} color={C.goldDk} style={{ animation:"spin 1s linear infinite" }} />
                      <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>Thinking…</span>
                    </div>
                  ) : (
                    <div className="markdown-body" style={{ fontSize:13, color:C.ink2, lineHeight:1.7, overflowX:"auto" }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>
                  )}
                  {/* Inline CTA tab buttons after first AI message */}
                  {i === 1 && FOLLOW_UPS.length > 0 && (
                    <div style={{ marginTop:16 }}>
                      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:10 }}>
                        {/* Analytics tab — always first */}
                        <button onClick={() => { setRightPanelView("analytics"); setRightPanelOpen(true); }}
                          style={{ fontSize:11, padding:"7px 15px", borderRadius:T.radPill,
                            border:`1px solid ${rightPanelView === "analytics" ? C.gold : C.line2}`,
                            background: rightPanelView === "analytics" ? `${C.gold}15` : C.card,
                            color: rightPanelView === "analytics" ? C.goldDk : C.ink2,
                            cursor:"pointer", fontFamily:FONT, fontWeight: rightPanelView === "analytics" ? 700 : 500,
                            transition:`all .2s ${T.ease}` }}>
                          Analytics
                        </button>
                        {FOLLOW_UPS.filter(f => f.panel_key !== "invite-team" && !(f.panel_key && f.panel_key.includes("simulation"))).map((f, fi) => {
                          const active = f.type === "panel" && rightPanelView === f.panel_key;
                          return (
                            <button key={fi} onClick={() => {
                                if (f.type === "panel" && f.panel_key) { setRightPanelView(f.panel_key); setRightPanelOpen(true); }
                                else setInput(f.prompt || f.label);
                              }}
                              style={{ fontSize:11, padding:"7px 15px", borderRadius:T.radPill,
                                border:`1px solid ${active ? C.gold : C.line2}`,
                                background: active ? `${C.gold}15` : C.card,
                                color: active ? C.goldDk : C.ink2,
                                cursor:"pointer", fontFamily:FONT, fontWeight: active ? 700 : 500,
                                display:"flex", alignItems:"center", gap:5,
                                transition:`all .2s ${T.ease}` }}>
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                      {FOLLOW_UPS.find(f => f.panel_key === "invite-team") && (
                        <button onClick={() => { setRightPanelView("invite-team"); setRightPanelOpen(true); }}
                          style={{ fontSize:11, padding:"8px 18px", borderRadius:T.radPill,
                            border:`1px solid ${C.brand}`, background:`${C.brand}12`,
                            color:C.brand, cursor:"pointer", fontFamily:FONT, fontWeight:700,
                            display:"flex", alignItems:"center", gap:7,
                            transition:`all .2s ${T.ease}` }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${C.brand}25`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = `${C.brand}12`; }}>
                          <Users size={13} /> Invite team to investigate
                        </button>
                      )}
                      <button onClick={() => {
                          const chatHistory = messages.filter(m => m.text).map(m => ({ role: m.role === "ai" ? "assistant" : "user", text: m.text }));
                          const simQuery = `Simulate: ${ctx.title} — model the financial impact and strategic options based on our analysis.`;
                          go("decision-with-sim-context", {
                            query: simQuery,
                            cardTitle: ctx.title,
                            signalContext: ctx.ai_response,
                            chatHistory,
                          });
                        }}
                          style={{ fontSize:11, padding:"8px 18px", borderRadius:T.radPill,
                            border:`1px solid ${C.brand}`, background:`${C.brand}12`,
                            color:C.brand, cursor:"pointer", fontFamily:FONT, fontWeight:700,
                            display:"flex", alignItems:"center", gap:7,
                            transition:`all .2s ${T.ease}` }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${C.brand}25`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = `${C.brand}12`; }}>
                          <ArrowRight size={13} /> Go to Decision Lab
                        </button>
                      {attention?.cta2_label && (
                        <button onClick={() => go(attention.cta2_action || "deep-enterprise")}
                          style={{ fontSize:11, padding:"8px 18px", borderRadius:T.radPill,
                            border:`1px solid ${C.brand}`, background:`${C.brand}12`,
                            color:C.brand, cursor:"pointer", fontFamily:FONT, fontWeight:700,
                            display:"flex", alignItems:"center", gap:7,
                            transition:`all .2s ${T.ease}` }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${C.brand}25`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = `${C.brand}12`; }}>
                          <ArrowRight size={13} /> {attention.cta2_label}
                        </button>
                      )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ background:`${C.gold}06`, border:`1px solid ${C.gold}28`, borderRadius:T.radLg, padding:"16px 20px", marginBottom:14, boxShadow:T.shadow1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:16, height:16, border:`2px solid ${C.gold}`, borderTop:`2px solid transparent`, borderRadius:"50%", animation:"spin 1s linear infinite" }} />
                <span style={{ fontSize:11, color:C.goldDk, fontWeight:600, letterSpacing:".14em", textTransform:"uppercase" }}>Analysing…</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
          {/* Inline input — matches home pill structure */}
          <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:8,
            borderRadius:T.radPill, padding:"8px 8px 8px 18px",
            background:C.card, border:`1px solid ${C.line}`,
            backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
            <MessageSquare size={15} color={C.goldDk} style={{ flexShrink:0 }} />
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Ask about this signal…"
              style={{ flex:1, border:"none", outline:"none", fontSize:13, fontFamily:FONT, color:C.ink, background:"transparent", padding:"6px 0", minWidth:0 }} />
            <button onClick={chatVoice.toggle}
              style={{ width:30, height:30, borderRadius:999, border:`1px solid ${chatVoice.listening ? C.red : C.line}`,
                background: chatVoice.listening ? `${C.red}15` : "transparent", cursor:"pointer", display:"grid", placeItems:"center", flexShrink:0,
                transition:`all .15s ${T.ease}`, animation: chatVoice.listening ? "pulse 1.2s infinite" : "none" }}
              title={chatVoice.listening ? "Listening…" : "Voice input"}>
              <Mic size={13} color={chatVoice.listening ? C.red : C.muted} />
            </button>
            <button onClick={handleSend}
              style={{ width:32, height:32, borderRadius:999, background:T.goldFoil, border:"none",
                cursor:"pointer", display:"grid", placeItems:"center", flexShrink:0,
                boxShadow:T.shadowGoldGlow }}>
              <Send size={13} color={C.navBg} />
            </button>
          </div>
        </div>}

        {/* Right panel — analytics overview + invite-team */}
        <div ref={rightPanelRef} style={{ overflowY: rightPanelOpen ? "auto" : "hidden", paddingBottom: rightPanelOpen ? 220 : 0, paddingRight: rightPanelOpen ? 12 : 0, position: "relative" }}>
          {/* Collapse/expand toggle */}
          <button onClick={() => setRightPanelOpen(p => !p)}
            style={{ position: rightPanelOpen ? "absolute" : "relative", top: rightPanelOpen ? 4 : 8, right: rightPanelOpen ? 12 : "auto", left: rightPanelOpen ? "auto" : "50%", transform: rightPanelOpen ? "none" : "translateX(-50%)", zIndex: 10, width: 30, height: 30, borderRadius: 8,
              background: C.card, border: `1px solid ${C.line}`, cursor: "pointer", display: "grid", placeItems: "center",
              boxShadow: T.shadow1, transition: `all .2s ${T.ease}` }}
            title={rightPanelOpen ? "Collapse panel" : "Expand panel"}>
            {rightPanelOpen ? <PanelLeftClose size={14} color={C.muted} /> : <PanelLeftOpen size={14} color={C.goldDk} />}
          </button>
          {rightPanelOpen && <>
          {/* Default analytics view */}
          {rightPanelView === "analytics" && (<>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <span style={{ width:18, height:1, background:T.goldFoil }} />
            <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>{ctx.context_summary || "Signal Investigation"}</span>
          </div>
          <div style={{ fontFamily:DISP, fontWeight:600, fontSize:26, color:C.ink, letterSpacing:"-.02em", lineHeight:1.15 }}>{ctx.title}</div>
          {ctx.signal_type && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
              <span style={{ fontSize:9.5, fontWeight:700, padding:"3px 9px", borderRadius:T.radSm, background:C.line, color:C.muted, letterSpacing:".14em", textTransform:"uppercase" }}>{ctx.signal_type}</span>
              {ctx.delta_value && <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:T.radSm, background:`${ (ctx.delta_value.includes("-") || ctx.delta_value.includes("−")) ? C.red : C.green}15`, color: (ctx.delta_value.includes("-") || ctx.delta_value.includes("−")) ? C.red : C.green, letterSpacing:".04em", fontFamily:DISP }}>{ctx.delta_value}</span>}
              {ctx.source && <span style={{ fontSize:9.5, fontWeight:600, padding:"3px 9px", borderRadius:T.radSm, background:"transparent", color:C.faint, border:`1px solid ${C.line}` }}>{ctx.source}</span>}
            </div>
          )}
          {/* <div style={{ fontSize:13, color:C.muted, margin:"14px 0 22px", lineHeight:1.6, maxWidth:640 }}>
            Charts update as you explore different angles. Ask anything — the AI synthesises across CRM, market data, and analog patterns.
          </div> */}

          {ctx.kpis.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
              {ctx.kpis.slice(0,6).map((t, idx) => (
                <div key={idx} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:"14px 16px", boxShadow:T.shadow1 }}>
                  <div style={{ fontSize:9.5, letterSpacing:".18em", color:C.muted, fontWeight:700, marginBottom:8, textTransform:"uppercase" }}>{t.label}</div>
                  <div style={{ fontFamily:DISP, fontSize:22, fontWeight:600, color:t.neg ? C.red : C.green, letterSpacing:"-.02em", lineHeight:1.1 }}>{t.val}</div>
                  <div style={{ fontSize:11, color:C.faint, marginTop:6 }}>{t.sub}</div>
                </div>
              ))}
            </div>
          )}

          {ctx.affected_accounts.length > 0 && (
            <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:"14px 16px", marginBottom:18, boxShadow:T.shadow1 }}>
              <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.muted, fontWeight:700, marginBottom:8, textTransform:"uppercase" }}>Affected Accounts</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {ctx.affected_accounts.map((a,i) => <span key={i} style={{ fontSize:11, fontWeight:600, padding:"5px 10px", borderRadius:T.radPill, background:C.line, color:C.ink2 }}>{a}</span>)}
              </div>
            </div>
          )}

          {ctx.recommended_action && (
            <div style={{ background:`${C.gold}08`, border:`1px solid ${C.gold}33`, borderRadius:T.radMd, padding:"14px 16px", marginBottom:18 }}>
              <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.goldDk, fontWeight:700, marginBottom:6, textTransform:"uppercase" }}>Recommended Action</div>
              <div style={{ fontSize:12.5, color:C.ink2, lineHeight:1.55 }}>{ctx.recommended_action}</div>
            </div>
          )}

          {/* Story-specific analytics — tables, charts, narrative sections */}
          {ctx.default_analytics && (<>
            {(ctx.default_analytics.tables || []).map((tbl, ti) => (
              <div key={ti} style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", marginBottom:18, boxShadow:T.shadow1, overflowX:"auto" }}>
                <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:C.ink, marginBottom:14, letterSpacing:"-.01em" }}>{tbl.title}</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11.5, fontFamily:FONT }}>
                  <thead>
                    <tr>{tbl.columns.map((col,ci) => (
                      <th key={ci} style={{ textAlign:"left", padding:"8px 10px", borderBottom:`2px solid ${C.line}`, fontSize:9.5, letterSpacing:".14em", textTransform:"uppercase", color:C.muted, fontWeight:700, whiteSpace:"nowrap" }}>{col}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {tbl.rows.map((row,ri) => (
                      <tr key={ri} style={{ borderBottom:`1px solid ${C.line}08` }}>
                        {row.map((cell,ci) => {
                          const isHealth = tbl.columns[ci] === "Health" || tbl.columns[ci] === "Status";
                          const isUrgency = tbl.columns[ci] === "Urgency";
                          const isAccount = ci === 0;
                          const healthColor = (typeof cell === "string") && (cell === "Green" || cell.includes("✓")) ? C.green : (typeof cell === "string") && (cell === "Amber" || cell.includes("⚠")) ? C.amber : cell === "CRITICAL" || cell === "HIGH" ? C.red : null;
                          return (
                            <td key={ci} style={{ padding:"7px 10px", color: isUrgency && (cell === "CRITICAL" || cell === "HIGH") ? C.red : isAccount ? C.ink : C.ink2, fontWeight: isAccount || isUrgency ? 600 : 400, whiteSpace: ci > 2 ? "normal" : "nowrap" }}>
                              {isHealth && healthColor ? (
                                <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                                  <span style={{ width:8, height:8, borderRadius:999, background:healthColor, flexShrink:0 }} />
                                  {cell}
                                </span>
                              ) : cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {(ctx.default_analytics.charts || []).map((chart, ci) => (
              <div key={ci} data-pdf-chart={chart.title} style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 18px 6px", marginBottom:18, boxShadow:T.shadow1 }}>
                <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:C.ink, marginBottom:12 }}>{chart.title}</div>
                <DynamicChart spec={{ ...chart, chart_type: chart.type }} />
              </div>
            ))}

            {(ctx.default_analytics.narrative_sections || []).map((ns, ni) => (
              <div key={ni} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"20px 22px", marginBottom:18, boxShadow:T.shadow1 }}>
                <div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:C.ink, marginBottom:14, letterSpacing:"-.01em" }}>{ns.heading}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                  {(ns.bullets || []).map((b, bi) => (
                    <div key={bi} style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"8px 12px",
                      background: bi % 2 === 0 ? `${C.gold}05` : "transparent",
                      borderRadius: bi === 0 ? `${T.radMd} ${T.radMd} 0 0` : bi === (ns.bullets||[]).length - 1 ? `0 0 ${T.radMd} ${T.radMd}` : 0,
                      borderBottom: bi < (ns.bullets||[]).length - 1 ? `1px solid ${C.line}` : "none" }}>
                      <div style={{ width:5, height:5, borderRadius:999, background:C.goldDk, flexShrink:0, marginTop:6 }} />
                      <div style={{ fontSize:12.5, color:C.ink2, lineHeight:1.6, flex:1 }}
                        dangerouslySetInnerHTML={{ __html: b.replace(/\*\*(.*?)\*\*/g, '<strong style="color:'+C.ink+'">$1</strong>') }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>)}

          {/* Download Report */}
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8, marginBottom:8 }}>
            <button onClick={async () => {
              const chartImages = await captureCharts(rightPanelRef.current);
              await downloadReport({
              title: ctx.title || "Signal Investigation Report",
              signalType: ctx.signal_type, deltaValue: ctx.delta_value, source: ctx.source,
              kpis: ctx.kpis, affectedAccounts: ctx.affected_accounts, recommendedAction: ctx.recommended_action,
              tables: ctx.default_analytics?.tables, narrativeSections: ctx.default_analytics?.narrative_sections,
              chartImages,
              timestamp: `${fmtDate({ weekday:"short", month:"short", day:"numeric", year:"numeric" })} · ${fmtTime()} EST`,
            }); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:T.radPill, border:`1px solid ${C.line}`, background:C.card, cursor:"pointer", fontFamily:FONT, fontSize:11, fontWeight:600, color:C.ink2, transition:`all .15s ${T.ease}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.ink; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.ink2; }}>
              <FileText size={13} /> Download Report
            </button>
          </div>
          <DataFootnote />
          </>)}

          {/* Non-analytics right panel views */}
          {activeRightView && rightPanelView !== "analytics" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              {activeRightView.key === "invite-team" ? (
                /* ── Invite Team Panel — two-column layout ── */
                (() => {
                  const whoSection = (activeRightView.content_sections || []).find(s => s.heading.toLowerCase().includes("who to include") || s.heading.toLowerCase().includes("pre-populated"));
                  const members = whoSection ? whoSection.body.split("\n").filter(l => l.trim().startsWith("•")).map((l, i) => {
                    const clean = l.replace(/^•\s*/, "").replace(/\*\*/g, "");
                    const dashIdx = clean.indexOf("—");
                    const parenIdx = clean.indexOf("(");
                    let name, role;
                    if (dashIdx > 0) { name = clean.slice(0, dashIdx).trim(); role = clean.slice(dashIdx + 1).trim(); }
                    else if (parenIdx > 0) { name = clean.slice(0, parenIdx).trim(); role = clean.slice(parenIdx).replace(/[()]/g, "").trim(); }
                    else { name = clean.trim(); role = ""; }
                    return { id: i, name, role };
                  }) : [];
                  const isChecked = (id) => selectedMembers[id] !== undefined ? selectedMembers[id] : true;
                  const toggleMember = (id) => setSelectedMembers(prev => ({ ...prev, [id]: !isChecked(id) }));
                  const checkedCount = members.filter(m => isChecked(m.id)).length;
                  const qSection = (activeRightView.content_sections || []).find(s => s.heading.toLowerCase().includes("question") || s.heading.toLowerCase().includes("suggested"));
                  const questions = qSection ? qSection.body.split("\n").filter(l => l.trim().startsWith("•")).map(l => l.replace(/^•\s*/, "").replace(/\*\*/g, "").trim()) : [];

                  return (
                    <div>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ width:18, height:1, background:T.goldFoil }} />
                          <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Working Group</span>
                        </div>
                        {!inviteOnly && <button onClick={() => { setRightPanelView("analytics"); setGroupStarted(false); }}
                          style={{ fontSize:10, padding:"4px 10px", borderRadius:T.radPill, border:`1px solid ${C.line2}`, background:"transparent", color:C.muted, cursor:"pointer", fontFamily:FONT, fontWeight:500 }}>
                          Back to Analytics
                        </button>}
                      </div>
                      <div style={{ fontFamily:DISP, fontWeight:600, fontSize:24, color:C.ink, letterSpacing:"-.02em", lineHeight:1.15, marginBottom:4 }}>
                        {activeRightView.title}
                      </div>
                      <div style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.5 }}>
                        {activeRightView.subtitle}
                      </div>

                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                        <div>
                          <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", marginBottom:14 }}>Who to Include ({checkedCount})</div>
                          {members.map(mem => (
                            <div key={mem.id} onClick={() => toggleMember(mem.id)}
                              style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", marginBottom:6,
                                background: isChecked(mem.id) ? `${C.gold}08` : T.cardElevated,
                                border:`1px solid ${isChecked(mem.id) ? `${C.gold}50` : C.line}`, borderRadius:T.radMd, cursor:"pointer",
                                transition:`all .2s ${T.ease}` }}>
                              <input type="checkbox" checked={isChecked(mem.id)} onChange={() => {}} onClick={e => e.stopPropagation()} style={{ marginTop:2, accentColor:C.gold, width:15, height:15, pointerEvents:"none" }} />
                              <div>
                                <div style={{ fontSize:13, fontWeight:600, color:C.ink, lineHeight:1.3 }}>{mem.name}</div>
                                {mem.role && <div style={{ fontSize:11, color:C.muted, marginTop:2, lineHeight:1.4 }}>{mem.role}</div>}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", marginBottom:14 }}>Share Preview</div>
                          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"16px 18px", marginBottom:16 }}>
                            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:C.ink, marginBottom:8 }}>{activeRightView.sharePreview ? activeRightView.sharePreview.title : ctx.title}</div>
                            <div style={{ fontSize:12, color:C.ink2, lineHeight:1.6, marginBottom:10 }}>{activeRightView.sharePreview ? activeRightView.sharePreview.subtitle : ctx.context_summary}</div>
                            {(activeRightView.sharePreview ? activeRightView.sharePreview.metrics : (ctx.kpis || []).slice(0, 3)).map((k, ki) => (
                              <div key={ki} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderTop:`1px solid ${C.line}` }}>
                                <span style={{ fontSize:11, color:C.muted }}>{k.label}</span>
                                <span style={{ fontSize:12, fontWeight:600, color: k.neg ? C.red : C.ink, fontFamily:DISP }}>{k.val}</span>
                              </div>
                            ))}
                          </div>

                          {questions.length > 0 && (
                            <div>
                              <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Key Supporting Questions</div>
                              {questions.map((q, qi) => (
                                <div key={qi} style={{ fontSize:12, color:C.ink2, lineHeight:1.5, padding:"8px 0", borderBottom:`1px solid ${C.line}08`, display:"flex", gap:8, alignItems:"flex-start" }}>
                                  <span style={{ color:C.gold, flexShrink:0, marginTop:2 }}>?</span>
                                  <span>{q}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {groupStarted ? (
                        <div style={{ marginTop:20, background:`${C.green}0C`, border:`1px solid ${C.green}40`, borderRadius:T.radLg, padding:"20px 24px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                          <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.green, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Working Group Started</div>
                          <div style={{ fontSize:13, color:C.ink, fontWeight:600, marginBottom:6 }}>Invitations sent to {checkedCount} team member{checkedCount !== 1 ? "s" : ""}.</div>
                          <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>They'll see the share preview and a link back to this investigation.</div>
                        </div>
                      ) : (
                        <div style={{ marginTop:20, display:"flex", justifyContent:"center" }}>
                          <button onClick={() => setGroupStarted(true)} disabled={checkedCount === 0}
                            style={{ padding:"10px 22px", borderRadius:T.radPill,
                              background: checkedCount === 0 ? C.line : T.goldFoil, color: checkedCount === 0 ? C.muted : "#0A1628",
                              border:"none", cursor: checkedCount === 0 ? "default" : "pointer",
                              fontFamily:FONT, fontWeight:700, fontSize:11.5, letterSpacing:".05em", textTransform:"uppercase",
                              boxShadow: checkedCount === 0 ? "none" : T.shadowGoldGlow, transition:`all .15s ${T.ease}`,
                              display:"flex", alignItems:"center", gap:7 }}
                            onMouseEnter={e => { if (checkedCount > 0) e.currentTarget.style.transform = "scale(1.02)"; }}
                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                            Start a Group Chat on Teams ({checkedCount})
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* ── Evidence / other panel views with proper table support ── */
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <span style={{ width:18, height:1, background:T.goldFoil }} />
                    <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>{activeRightView.label}</span>
                  </div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:26, color:C.ink, letterSpacing:"-.02em", lineHeight:1.15, marginBottom:6 }}>
                    {activeRightView.title}
                  </div>
                  <div style={{ fontSize:13, color:C.muted, marginBottom:22, lineHeight:1.6 }}>
                    {activeRightView.subtitle}
                  </div>

                  {activeRightView.metrics && activeRightView.metrics.length > 0 && (
                    <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(activeRightView.metrics.length, 4)},1fr)`, gap:12, marginBottom:22 }}>
                      {activeRightView.metrics.map((m, idx) => (
                        <div key={idx} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:"14px 16px", boxShadow:T.shadow1 }}>
                          <div style={{ fontSize:9.5, letterSpacing:".18em", color:C.muted, fontWeight:700, marginBottom:8, textTransform:"uppercase" }}>{m.label}</div>
                          <div style={{ fontFamily:DISP, fontSize:22, fontWeight:600, color: (m.val.includes("-") || m.val.includes("−")) ? C.red : m.val === "HIGH" ? C.green : C.ink, letterSpacing:"-.02em", lineHeight:1.1 }}>{m.val}</div>
                          <div style={{ fontSize:11, color:C.faint, marginTop:6 }}>{m.sub}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Structured tables (e.g. account-breakdown health table) */}
                  {activeRightView.tables && activeRightView.tables.map((tbl, ti) => (
                    <div key={ti} style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", marginBottom:18, boxShadow:T.shadow1, overflowX:"auto" }}>
                      <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:C.ink, marginBottom:14, letterSpacing:"-.01em" }}>{tbl.title}</div>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11.5, fontFamily:FONT }}>
                        <thead>
                          <tr>{tbl.columns.map((col,ci) => (
                            <th key={ci} style={{ textAlign:"left", padding:"8px 10px", borderBottom:`2px solid ${C.line}`, fontSize:9.5, letterSpacing:".14em", textTransform:"uppercase", color:C.muted, fontWeight:700, whiteSpace:"nowrap" }}>{col}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {tbl.rows.map((row,ri) => (
                            <tr key={ri} style={{ borderBottom:`1px solid ${C.line}08` }}>
                              {row.map((cell,ci) => {
                                const isHealth = tbl.columns[ci] === "Health" || tbl.columns[ci] === "Status";
                                const isAccount = ci === 0;
                                const healthColor = cell === "Green" ? C.green : cell === "Amber" ? C.amber : cell === "CRITICAL" || cell === "HIGH" ? C.red : null;
                                return (
                                  <td key={ci} style={{ padding:"7px 10px", color: isAccount ? C.ink : C.ink2, fontWeight: isAccount ? 600 : 400, whiteSpace: ci > 2 ? "normal" : "nowrap" }}>
                                    {isHealth && healthColor ? (
                                      <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                                        <span style={{ width:8, height:8, borderRadius:999, background:healthColor, flexShrink:0 }} />
                                        {cell}
                                      </span>
                                    ) : cell}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}

                  {activeRightView.content_sections && activeRightView.content_sections.map((section, idx) => {
                    const body = section.body || "";
                    const hasBullets = body.includes("\n•") || body.startsWith("•");
                    const bulletLines = hasBullets ? body.split("\n").filter(l => l.trim().startsWith("•")) : [];
                    const paraParts = hasBullets ? body.split("\n").filter(l => !l.trim().startsWith("•") && l.trim()).join("\n") : body;
                    const kvPattern = /^•\s*\*\*[^*]+\*\*\s*[:\—\–]\s*.+/;
                    const kvPatternInside = /^•\s*\*\*[^*]+[:\—\–]\*\*\s*.+/;
                    const hasKeyValue = bulletLines.length > 0 && bulletLines.every(l => kvPattern.test(l.trim()) || kvPatternInside.test(l.trim()));
                    const hasConfidence = body.includes("**Confidence:");

                    if (hasKeyValue && bulletLines.length >= 2) {
                      const items = bulletLines.map(l => {
                        const clean = l.replace(/^•\s*/, "");
                        const matchAfter = clean.match(/\*\*(.*?)\*\*\s*[:\—\–]\s*(.*)/);
                        const matchInside = clean.match(/\*\*(.*?)[:\—\–]\*\*\s*(.*)/);
                        const boldMatch = matchAfter && matchAfter[2].trim() ? matchAfter : matchInside;
                        if (boldMatch) return { label: boldMatch[1].replace(/[:\—\–]\s*$/, "").trim(), value: boldMatch[2].trim() };
                        return { label: "", value: clean.replace(/\*\*/g, "") };
                      });
                      const confMatch = body.match(/\*\*Confidence:\s*(.*?)\*\*/);
                      return (
                        <div key={idx} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 24px", marginBottom:18, boxShadow:T.shadow1 }}>
                          <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:C.ink, marginBottom:16, letterSpacing:"-.01em" }}>
                            {section.heading}
                          </div>
                          {paraParts.trim() && !paraParts.includes("**Confidence:") && (
                            <div style={{ fontSize:12.5, color:C.ink2, lineHeight:1.65, marginBottom:16 }}
                              dangerouslySetInnerHTML={{ __html: paraParts.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '<br/><br/>') }} />
                          )}
                          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                            {items.map((item, ii) => (
                              <div key={ii} style={{ display:"grid", gridTemplateColumns:"minmax(180px,1fr) 2fr", gap:0,
                                padding:"12px 16px", background: ii % 2 === 0 ? `${C.gold}06` : "transparent",
                                borderBottom: ii < items.length - 1 ? `1px solid ${C.line}` : "none",
                                borderRadius: ii === 0 ? `${T.radMd} ${T.radMd} 0 0` : ii === items.length - 1 ? `0 0 ${T.radMd} ${T.radMd}` : 0 }}>
                                <div style={{ fontSize:12, fontWeight:700, color:C.ink, display:"flex", alignItems:"center", gap:8 }}>
                                  <span style={{ width:6, height:6, borderRadius:999, background: item.value.includes("+") || item.value.includes("above") ? C.green : item.value.includes("−") || item.value.includes("–") || item.value.includes("-$") ? C.red : C.goldDk, flexShrink:0 }} />
                                  {item.label === item.label.toUpperCase() && item.label.length > 1 ? item.label.charAt(0) + item.label.slice(1).toLowerCase() : item.label}
                                </div>
                                <div style={{ fontSize:12, color:C.ink2, lineHeight:1.55 }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                          {confMatch && (
                            <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background: confMatch[1].includes("HIGH") ? `${C.green}10` : `${C.amber}10`, borderRadius:T.radMd, border:`1px solid ${confMatch[1].includes("HIGH") ? `${C.green}30` : `${C.amber}30`}` }}>
                              <span style={{ width:8, height:8, borderRadius:999, background: confMatch[1].includes("HIGH") ? C.green : C.amber }} />
                              <span style={{ fontSize:11, fontWeight:700, color: confMatch[1].includes("HIGH") ? C.green : C.amber, letterSpacing:".06em" }}>CONFIDENCE: {confMatch[1].trim()}</span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (hasBullets && bulletLines.length >= 2 && !hasKeyValue) {
                      const items = bulletLines.map(l => {
                        const clean = l.replace(/^•\s*/, "");
                        const boldMatch = clean.match(/\*\*(.*?)\*\*\s*[:\—\–\s]*(.*)/);
                        if (boldMatch) return { title: boldMatch[1].replace(/[:\—\–]\s*$/, "").trim(), desc: boldMatch[2].trim() };
                        return { title: "", desc: clean.replace(/\*\*/g, "") };
                      });
                      return (
                        <div key={idx} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 24px", marginBottom:18, boxShadow:T.shadow1 }}>
                          <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:C.ink, marginBottom:16, letterSpacing:"-.01em" }}>
                            {section.heading}
                          </div>
                          {paraParts.trim() && (
                            <div style={{ fontSize:12.5, color:C.ink2, lineHeight:1.65, marginBottom:16 }}
                              dangerouslySetInnerHTML={{ __html: paraParts.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '<br/><br/>') }} />
                          )}
                          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                            {items.map((item, ii) => (
                              <div key={ii} style={{ padding:"14px 18px", background:`${C.gold}05`, border:`1px solid ${C.line}`, borderRadius:T.radMd,
                                borderLeft:`3px solid ${item.desc.includes("CRITICAL") || item.desc.includes("HIGH") ? C.red : item.desc.includes("MEDIUM") ? C.amber : item.desc.includes("LOW") || item.desc.includes("above") || item.desc.includes("+") ? C.green : C.goldDk}` }}>
                                {item.title && <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:4, lineHeight:1.3 }}>{item.title}</div>}
                                <div style={{ fontSize:12, color:C.ink2, lineHeight:1.6 }}>{item.desc || item.title}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    const paragraphs = body.split("\n\n").filter(p => p.trim());
                    const isEvidence = paragraphs.length >= 2 && paragraphs.filter(p => /^\*\*/.test(p.trim())).length >= 2;

                    if (isEvidence) {
                      return (
                        <div key={idx} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 24px", marginBottom:18, boxShadow:T.shadow1 }}>
                          <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:C.ink, marginBottom:16, letterSpacing:"-.01em" }}>
                            {section.heading}
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                            {paragraphs.map((p, pi) => {
                              const boldHead = p.match(/^\*\*(.*?)\*\*\s*[:\s]*(.*)/s);
                              const isConf = p.includes("**Confidence:");
                              if (isConf) {
                                return (
                                  <div key={pi} style={{ marginTop:10, display:"flex", alignItems:"center", gap:8, padding:"8px 14px",
                                    background: p.includes("HIGH") ? `${C.green}10` : `${C.amber}10`,
                                    borderRadius:T.radMd, border:`1px solid ${p.includes("HIGH") ? `${C.green}30` : `${C.amber}30`}` }}>
                                    <span style={{ width:8, height:8, borderRadius:999, background: p.includes("HIGH") ? C.green : C.amber }} />
                                    <span style={{ fontSize:11, fontWeight:700, color: p.includes("HIGH") ? C.green : C.amber, letterSpacing:".06em" }}
                                      dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                  </div>
                                );
                              }
                              return (
                                <div key={pi} style={{ padding:"12px 14px", borderBottom: pi < paragraphs.length - 1 ? `1px solid ${C.line}` : "none",
                                  background: pi % 2 === 0 ? `${C.gold}05` : "transparent",
                                  borderRadius: pi === 0 ? `${T.radMd} ${T.radMd} 0 0` : "0" }}>
                                  {boldHead ? (<>
                                    <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:4, lineHeight:1.3 }}>{boldHead[1].replace(/[:\s]*$/, "")}</div>
                                    <div style={{ fontSize:12, color:C.ink2, lineHeight:1.65 }}>{boldHead[2]}</div>
                                  </>) : (
                                    <div style={{ fontSize:12, color:C.ink2, lineHeight:1.65 }}
                                      dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 24px", marginBottom:18, boxShadow:T.shadow1 }}>
                        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:C.ink, marginBottom:14, letterSpacing:"-.01em" }}>
                          {section.heading}
                        </div>
                        <div style={{ fontSize:12.5, color:C.ink2, lineHeight:1.7 }}
                          dangerouslySetInnerHTML={{ __html: body
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n\n/g, '<br/><br/>')
                            .replace(/\n•/g, '<br/>•')
                            .replace(/\n\*/g, '<br/>*')
                          }} />
                      </div>
                    );
                  })}

                  {/* Download Report */}
                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8, marginBottom:8 }}>
                    <button onClick={async () => {
                      const chartImages = await captureCharts(rightPanelRef.current);
                      await downloadReport({
                      title: activeRightView.title || "Report", subtitle: activeRightView.subtitle,
                      metrics: activeRightView.metrics, tables: activeRightView.tables,
                      contentSections: activeRightView.content_sections, chartImages,
                      timestamp: `${fmtDate({ weekday:"short", month:"short", day:"numeric", year:"numeric" })} · ${fmtTime()} EST`,
                    }); }}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:T.radPill, border:`1px solid ${C.line}`, background:C.card, cursor:"pointer", fontFamily:FONT, fontSize:11, fontWeight:600, color:C.ink2, transition:`all .15s ${T.ease}` }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.ink; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.ink2; }}>
                      <FileText size={13} /> Download Report
                    </button>
                  </div>
                  <DataFootnote />
                </div>
              )}
            </div>
          )}
          </>}
        </div>
      </div>

      {/* Input inline at bottom of chat column — no floating bar */}
    </div>
  );
}

const DONUT_COLORS = [C.gold, C.navBg2, C.brandLt, C.green, C.red, C.goldDk, C.brand, C.muted];

function DynamicChart({ spec }) {
  const colors = spec.colors || DONUT_COLORS;
  const xKey = spec.x_key || "name";

  // Coerce string numbers to actual numbers and auto-detect data keys
  const parseNum = (v) => {
    if (typeof v === "number") return v;
    if (typeof v !== "string" || !v) return NaN;
    const cleaned = v.replace(/[$%,BMKk]/g, "").trim();
    const n = Number(cleaned);
    if (isNaN(n)) return NaN;
    if (/[Bb]$/i.test(v.trim())) return n * 1000;
    if (/[Mm]$/i.test(v.trim())) return n;
    if (/[Kk]$/i.test(v.trim())) return n / 1000;
    return n;
  };
  const chartData = (spec.data || []).map(d => {
    const row = { ...d };
    Object.keys(row).forEach(k => {
      if (k === (spec.x_key || "name")) return;
      const n = parseNum(row[k]);
      if (!isNaN(n)) row[k] = n;
    });
    return row;
  });
  const rawKeys = spec.data_keys || ["value"];
  const sample = chartData[0] || {};
  const keysExist = rawKeys.some(k => k in sample && typeof sample[k] === "number");
  const dataKeys = keysExist ? rawKeys : Object.keys(sample).filter(k => k !== (spec.x_key || "name") && typeof sample[k] === "number");
  if (dataKeys.length === 0) dataKeys.push("value");

  const legendNames = spec.legend_names || dataKeys;

  // Debug: if no valid data points, show fallback message
  const hasValidData = chartData.length > 0 && dataKeys.some(dk => chartData.some(d => typeof d[dk] === "number" && d[dk] !== 0));
  if (!hasValidData && chartData.length > 0) {
    // Try to salvage: find ANY numeric key across all data points
    const allNumericKeys = new Set();
    chartData.forEach(d => Object.keys(d).forEach(k => { if (k !== xKey && typeof d[k] === "number") allNumericKeys.add(k); }));
    if (allNumericKeys.size > 0) {
      dataKeys.length = 0;
      allNumericKeys.forEach(k => dataKeys.push(k));
    }
  }

  if (spec.chart_type === "line") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: C.faint }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
          {dataKeys.map((dk, i) => (
            <Line key={dk} type="monotone" dataKey={dk} name={legendNames[i]} stroke={colors[i % colors.length]}
              strokeWidth={2.5} dot={{ r: 4, fill: colors[i % colors.length] }} />
          ))}
          {dataKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (spec.chart_type === "area") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: C.faint }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
          {dataKeys.map((dk, i) => (
            <Area key={dk} type="monotone" dataKey={dk} stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]} fillOpacity={0.15} strokeWidth={2} />
          ))}
          {dataKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (spec.chart_type === "donut") {
    const dataKey = dataKeys[0] || "value";
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} dataKey={dataKey} nameKey={xKey} cx="50%" cy="50%"
            innerRadius={55} outerRadius={85} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: C.faint }} style={{ fontSize: 11 }}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (spec.chart_type === "stacked_bar") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: C.faint }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          {dataKeys.map((dk, i) => (
            <Bar key={dk} dataKey={dk} name={legendNames[i]} stackId="a" fill={colors[i % colors.length]} radius={i === dataKeys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar chart
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: C.faint }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
        {dataKeys.map((dk, i) => (
          <Bar key={dk} dataKey={dk} name={legendNames[i]} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} maxBarSize={40} />
        ))}
        {dataKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

function FastSimulationView({ initialQuery, initialContext, onCreateBrief, go, simSessions, refreshSimSessions }) {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSimHistory, setShowSimHistory] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [attachedDoc, setAttachedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const containerRef = useRef(null);
  const mainContentRef = useRef(null);
  const [barPos, setBarPos] = useState({ left: 0, width: "100%" });
  const voice = useVoiceInput((t) => setInput(prev => prev ? prev + " " + t : t));
  const autoSentRef = useRef(false);

  useEffect(() => { if (initialQuery && !initialContext) setInput(initialQuery); }, [initialQuery]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);
  useEffect(() => {
    const target = mainContentRef.current || containerRef.current;
    if (!target) return;
    const update = () => {
      const r = (mainContentRef.current || containerRef.current)?.getBoundingClientRect();
      if (r) setBarPos({ left: r.left, width: r.width });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(target);
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, [showSimHistory]);

  useEffect(() => {
    if (initialContext && !autoSentRef.current) {
      autoSentRef.current = true;
      const chatHistoryText = (initialContext.chatHistory || [])
        .map(m => `${m.role === "user" ? "User" : "Companion"}: ${m.text}`).join("\n");
      const contextBlock = [
        initialContext.signalContext ? `[Prior chat context about: ${initialContext.cardTitle || "signal"}]\n${initialContext.signalContext}` : "",
        chatHistoryText ? `[Full chat conversation]\n${chatHistoryText}` : "",
      ].filter(Boolean).join("\n\n");
      const baseQuery = initialContext.query || initialQuery || "";
      if (!baseQuery) return;
      const enrichedQuery = contextBlock ? `${baseQuery}\n\n${contextBlock}` : baseQuery;
      setMessages([{ role:"user", text:baseQuery }, { role:"agent", text:"", options:null, simResult:null, isStreaming:true }]);
      setInput("");
      setLoading(true);
      let buffered = "";
      let autoSid = null;
      createSimSession(baseQuery.slice(0, 80)).then(s => {
        autoSid = s.id;
        setActiveSessionId(s.id);
        persistMessage(s.id, "user", baseQuery);
      }).catch(() => {});
      streamFastSimulation(enrichedQuery, {
        history: null,
        onChunk: (chunk) => {
          buffered += chunk;
          let cleanText = buffered;
          let options = null;
          let simResult = null;
          const hasOptionsOpen = (buffered.includes("<options>") && !buffered.includes("</options>")) || (buffered.includes("<option ") && !buffered.includes("</option>"));
          const hasSimOpen = buffered.includes("<sim_result>") && !buffered.includes("</sim_result>");
          if (!hasOptionsOpen) { options = _parseOpts(cleanText); if (options) { cleanText = _stripTag(cleanText, "options"); cleanText = _stripTag(cleanText, "option"); } }
          else { cleanText = cleanText.split(/<option[s\s]/)[0]; }
          const simMatch = cleanText.match(/<sim_result>([\s\S]*?)<\/sim_result>/);
          if (simMatch) { try { simResult = JSON.parse(simMatch[1].trim()); } catch {} cleanText = cleanText.replace(simMatch[0], ""); }
          else if (hasSimOpen) { cleanText = cleanText.split("<sim_result>")[0]; }
          const hasSourcesOpen = buffered.includes("<sources>") && !buffered.includes("</sources>");
          let sources = !hasSourcesOpen ? _parseSources(cleanText) : null;
          if (sources) cleanText = _stripTag(cleanText, "sources");
          else if (hasSourcesOpen) cleanText = cleanText.split("<sources>")[0];
          if (!sources && simResult && simResult.sources) { sources = simResult.sources; }
          cleanText = cleanText.replace(/<\/?(?:options?|sim_result|sources|text|description|id)(?:\s[^>]*)?\/?>/g, "").trim();
          setMessages(prev => {
            const next = [...prev];
            if (next.length && next[next.length - 1].role === "agent") {
              next[next.length - 1] = { ...next[next.length - 1], text: cleanText, options, simResult, sources, isSkeletonOptions: hasOptionsOpen };
            }
            return next;
          });
        },
        onDone: () => {
          if (autoSid) persistMessage(autoSid, "agent", buffered);
          refreshSimSessions();
          setMessages(prev => {
            const next = [...prev];
            if (next.length && next[next.length - 1].role === "agent") next[next.length - 1] = { ...next[next.length - 1], isStreaming: false };
            return next;
          });
          setLoading(false);
        },
        onError: () => {
          setMessages(prev => {
            const next = [...prev];
            if (next.length && next[next.length - 1].role === "agent" && !next[next.length - 1].text) {
              next[next.length - 1] = { role:"agent", text:"Simulation failed. Please try again.", isStreaming:false };
            }
            return next;
          });
          setLoading(false);
        },
      });
    }
  }, [initialContext]);

  const SAMPLE_QUERIES = [
    "What's the worst-performing Tier-1 Auto account right now?",
    "If FedEx Auto Express drops their NAAF price 8%, which accounts are most at risk?",
    "Where should I deploy my next $1M of ABM budget for highest segment impact?",
    "What worked when we turned around Magna 18 months ago?",
    "Read-through if I shift Stellantis to a fully 1-to-1 ABM motion?",
  ];

  const urgencyColor = (u) => u === "high" ? C.red : u === "medium" ? C.amber : C.green;

  const handleSimFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const result = await uploadDocument(file);
      setAttachedDoc({ filename: result.filename, text: result.text_content, charCount: result.char_count });
    } catch (err) {
      toast(err.message || "Failed to upload document", "error");
    }
    setUploading(false);
  };

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setInput("");
    const history = messages.filter(m => !m.isStreaming).map(m => {
      const role = m.role === "agent" ? "model" : "user";
      let content = m.text || "";
      if (m.simResult) content += "\n[Simulation result: " + (m.simResult.verdict || "").slice(0, 300) + "]";
      if (m.options) content += "\n[Offered options: " + m.options.map(o => o.text).join(", ") + "]";
      return { role, text: content };
    });
    setMessages(prev => [...prev, { role:"user", text:msg }, { role:"agent", text:"", options:null, simResult:null, isStreaming:true }]);
    setLoading(true);

    const sid = await ensureSession(msg);
    if (sid) persistMessage(sid, "user", msg);

    let buffered = "";

    const docCtx = attachedDoc?.text || null;
    setAttachedDoc(null);

    await streamFastSimulation(msg, {
      history: history.length > 0 ? history : null,
      document_context: docCtx,
      onChunk: (chunk) => {
        buffered += chunk;
        let cleanText = buffered;
        let options = null;
        let simResult = null;

        const hasOptionsOpen = (buffered.includes("<options>") && !buffered.includes("</options>")) || (buffered.includes("<option ") && !buffered.includes("</option>"));
        const hasSimOpen = buffered.includes("<sim_result>") && !buffered.includes("</sim_result>");

        if (!hasOptionsOpen) { options = _parseOpts(cleanText); if (options) { cleanText = _stripTag(cleanText, "options"); cleanText = _stripTag(cleanText, "option"); } }
        else { cleanText = cleanText.split(/<option[s\s]/)[0]; }

        const simMatch = cleanText.match(/<sim_result>([\s\S]*?)<\/sim_result>/);
        if (simMatch) { try { simResult = JSON.parse(simMatch[1].trim()); } catch {} cleanText = cleanText.replace(simMatch[0], ""); }
        else if (hasSimOpen) { cleanText = cleanText.split("<sim_result>")[0]; }

        const hasSourcesOpen = buffered.includes("<sources>") && !buffered.includes("</sources>");
        let sources = !hasSourcesOpen ? _parseSources(cleanText) : null;
        if (sources) cleanText = _stripTag(cleanText, "sources");
        else if (hasSourcesOpen) cleanText = cleanText.split("<sources>")[0];
        if (!sources && simResult && simResult.sources) { sources = simResult.sources; }
        cleanText = cleanText.replace(/<\/?(?:options?|sim_result|sources|text|description|id)(?:\s[^>]*)?\/?>/g, "").trim();

        setMessages(prev => {
          const next = [...prev];
          if (next.length && next[next.length - 1].role === "agent") {
            next[next.length - 1] = { ...next[next.length - 1], text: cleanText, options, simResult, sources, isSkeletonOptions: hasOptionsOpen };
          }
          return next;
        });
      },
      onDone: () => {
        if (sid) persistMessage(sid, "agent", buffered);
        refreshSimSessions();
        setMessages(prev => {
          const next = [...prev];
          if (next.length && next[next.length - 1].role === "agent") next[next.length - 1] = { ...next[next.length - 1], isStreaming: false };
          return next;
        });
        setLoading(false);
      },
      onError: () => {
        setMessages(prev => {
          const next = [...prev];
          if (next.length && next[next.length - 1].role === "agent" && !next[next.length - 1].text) {
            next[next.length - 1] = { role:"agent", text:"Simulation failed. Please try again.", isStreaming:false };
          }
          return next;
        });
        setLoading(false);
      },
    });
  };

  const handleOptionSelect = (text) => { handleSend(text); };

  const lastSimResult = [...messages].reverse().find(m => m.simResult)?.simResult;
  const firstQuery = messages.find(m => m.role === "user")?.text || "";

  const ensureSession = async (queryText) => {
    if (activeSessionId) return activeSessionId;
    try {
      const s = await createSimSession(queryText.slice(0, 80));
      setActiveSessionId(s.id);
      return s.id;
    } catch { return null; }
  };

  const persistMessage = async (sessionId, role, text) => {
    if (!sessionId || !text) return;
    try { await saveSimMessage(sessionId, role, text); } catch {}
  };

  const loadHistorySession = async (session) => {
    try {
      const data = await fetchSimMessages(session.id);
      setMessages(data.messages.map(m => {
        const role = m.role === "agent" ? "agent" : "user";
        if (role !== "agent") return { role, text: m.text };
        let text = m.text || "";
        let simResult = null, options = null, sources = null;
        const simMatch = text.match(/<sim_result>([\s\S]*?)<\/sim_result>/);
        if (simMatch) { try { simResult = JSON.parse(simMatch[1].trim()); } catch {} text = text.replace(simMatch[0], ""); }
        options = _parseOpts(text);
        if (options) { text = _stripTag(text, "options"); text = _stripTag(text, "option"); }
        const srcMatch = text.match(/<sources>([\s\S]*?)<\/sources>/);
        if (srcMatch) { try { sources = JSON.parse(srcMatch[1].trim()); } catch {} text = text.replace(srcMatch[0], ""); }
        if (!sources && simResult && simResult.sources) sources = simResult.sources;
        text = text.replace(/<\/?(?:options?|sim_result|sources|text|description|id)(?:\s[^>]*)?\/?>/g, "").trim();
        return { role, text, simResult, options, sources };
      }));
      setActiveSessionId(session.id);
    } catch {}
    setShowSimHistory(false);
  };

  const inputBar = (
    <div>
    {attachedDoc && (
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 14px 4px", marginBottom:4, fontSize:11, color:C.goldDk, fontFamily:FONT }}>
        <FileText size={12} />
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{attachedDoc.filename}</span>
        <span style={{ fontSize:9, color:C.faint }}>{Math.round(attachedDoc.charCount / 1000)}k chars</span>
        <button onClick={() => setAttachedDoc(null)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"grid", placeItems:"center", color:C.faint }}>
          <X size={11} />
        </button>
      </div>
    )}
    <div style={{ background:"rgba(255,255,255,.92)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
      border:`1px solid ${C.line2}`, borderRadius:T.radPill,
      padding:"6px 6px 6px 12px", boxShadow:T.shadow2,
      display:"flex", alignItems:"center", gap:8 }}>
      <input type="file" ref={fileInputRef} accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display:"none" }} onChange={handleSimFileSelect} />
      <button onClick={() => fileInputRef.current?.click()} disabled={uploading || loading}
        style={{ background:"none", border:"none", cursor: uploading ? "wait" : "pointer", padding:2, display:"grid", placeItems:"center", color: attachedDoc ? C.goldDk : C.faint, flexShrink:0, opacity: uploading ? .5 : 1 }}>
        {uploading ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> : <Paperclip size={14} />}
      </button>
      <Search size={14} color={C.goldDk} style={{ flexShrink:0, opacity: loading ? .4 : 1 }} />
      <input value={input} onChange={(e) => !loading && setInput(e.target.value)}
        placeholder={loading ? "Analysing…" : "Ask your companion…"}
        disabled={loading}
        style={{ flex:1, border:"none", outline:"none", fontSize:13, fontFamily:FONT, color: loading ? C.muted : C.ink, background:"transparent", padding:"7px 0", minWidth:0, cursor: loading ? "not-allowed" : "text" }}
        onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()} />
      <button onClick={voice.toggle} disabled={loading}
        style={{ width:32, height:32, borderRadius:999, border:`1px solid ${voice.listening ? C.red : C.line}`,
          background: voice.listening ? `${C.red}15` : C.card, cursor: loading ? "not-allowed" : "pointer", display:"grid", placeItems:"center", flexShrink:0,
          transition:`all .15s ${T.ease}`, animation: voice.listening ? "pulse 1.2s infinite" : "none", opacity: loading ? .4 : 1 }}
        title={voice.listening ? "Listening…" : "Voice input"}>
        <Mic size={14} color={voice.listening ? C.red : C.muted} />
      </button>
      <button onClick={() => handleSend()} disabled={loading}
        style={{ width:34, height:34, borderRadius:999, background:T.goldFoil, border:"none",
          cursor: loading ? "not-allowed" : "pointer", display:"grid", placeItems:"center", flexShrink:0,
          boxShadow:T.shadowGoldGlow, transition:`transform .15s ${T.ease}`, opacity: loading ? .4 : 1 }}
        onMouseEnter={e => !loading && (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="Send">
        <Send size={15} color={C.navBg} />
      </button>
    </div>
    </div>
  );

  return (
    <div ref={containerRef} style={{ paddingBottom: messages.length > 0 ? 80 : 0 }}>
      {/* Header bar with controls */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <Sparkles size={14} color={C.goldDk} />
        <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>{messages.length === 0 ? "Ask the Companion" : "Lite Simulation"}</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
            <button onClick={() => setShowSimHistory(!showSimHistory)}
              style={{ background:showSimHistory?`${C.gold}18`:"none", border:`1px solid ${showSimHistory?C.gold:C.line}`, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:FONT, fontSize:10, fontWeight:600, color:showSimHistory?C.goldDk:C.muted, display:"flex", alignItems:"center", gap:5, transition:`all .2s ${T.ease}` }}>
              <Clock size={11} /> History{simSessions.length > 0 ? ` (${simSessions.length})` : ""}
            </button>
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); setActiveSessionId(null); autoSentRef.current = false; }}
              style={{ background:"none", border:`1px solid ${C.line}`, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:FONT, fontSize:10, fontWeight:600, color:C.muted, display:"flex", alignItems:"center", gap:5 }}>
              <Plus size={11} /> New
            </button>
          )}
        </div>
      </div>

      <div style={{ display:"flex", gap:16 }}>
        {/* History sidebar — fixed height with scroll */}
        {showSimHistory && (
          <div style={{ width:260, flexShrink:0, background:T.cardElevated, border:`1px solid ${C.gold}33`, borderRadius:T.radLg, boxShadow:T.shadow1, display:"flex", flexDirection:"column", position:"sticky", top:16, height:"calc(100vh - 280px)", maxHeight:"calc(100vh - 280px)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 10px", borderBottom:`1px solid ${C.gold}22`, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Clock size={12} color={C.goldDk} />
                <span style={{ fontSize:9, letterSpacing:".22em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Simulation History</span>
              </div>
              <button onClick={() => setShowSimHistory(false)} style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"grid", placeItems:"center" }}>
                <X size={12} color={C.muted} />
              </button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"8px 10px" }}>
            {simSessions.length === 0 ? (
              <div style={{ fontSize:12, color:C.faint, padding:"12px 0", textAlign:"center" }}>No previous simulations</div>
            ) : (
              simSessions.map(s => (
                  <div key={s.id}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, marginBottom:4,
                      cursor:"pointer", background: s.id === activeSessionId ? `${C.gold}12` : "transparent",
                      border:`1px solid ${s.id === activeSessionId ? C.gold + "30" : "transparent"}`, transition:`all .15s ${T.ease}` }}
                    onMouseEnter={e => { if (s.id !== activeSessionId) e.currentTarget.style.background = C.card; }}
                    onMouseLeave={e => { if (s.id !== activeSessionId) e.currentTarget.style.background = s.id === activeSessionId ? `${C.gold}12` : "transparent"; }}>
                    <div onClick={() => loadHistorySession(s)} style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.title}</div>
                      <div style={{ fontSize:10, color:C.faint, marginTop:2 }}>
                        {s.message_count} msg{s.message_count !== 1 ? "s" : ""} · {s.created_at ? new Date(s.created_at).toLocaleDateString([], { month:"short", day:"numeric" }) : ""}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteSimSession(s.id).then(() => { refreshSimSessions(); if (s.id === activeSessionId) { setMessages([]); setActiveSessionId(null); } }).catch(() => {}); }}
                      style={{ width:22, height:22, borderRadius:4, border:"none", background:"transparent", cursor:"pointer",
                        display:"grid", placeItems:"center", color:C.faint, flexShrink:0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = C.red; e.currentTarget.style.background = `${C.red}10`; }}
                      onMouseLeave={e => { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = "transparent"; }}>
                      <X size={11} />
                    </button>
                  </div>
                ))
            )}
            </div>
          </div>
        )}

        {/* Main content */}
        <div ref={mainContentRef} style={{ flex:1, minWidth:0 }}>
      {/* Input capsule — full card when no messages */}
      {messages.length === 0 && (
        <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"24px 26px", marginBottom:22, boxShadow:T.shadow2, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, opacity:.55 }} />
          {inputBar}
          <div style={{ marginTop:18, paddingTop:16, borderTop:`1px solid ${C.line}` }}>
            <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.muted, fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Quick prompts</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {SAMPLE_QUERIES.map((sq) => (
                <button key={sq} onClick={() => { setInput(sq); }}
                  style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radPill,
                    padding:"8px 14px", fontSize:11.5, color:C.ink2, cursor:"pointer", fontFamily:FONT,
                    fontWeight:500, textAlign:"left", lineHeight:1.3, transition:`all .2s ${T.ease}` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.ink; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.ink2; }}>
                  {sq}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {(() => { const filtered = messages.filter(m => !(m.role === "agent" && !m.text && !m.options && !m.simResult && !m.sources && !m.quickReplies)); return filtered.map((m, i) => (
            <div key={i}>
              {/* Message bubble — hide empty agent text when simResult/options carry the content */}
              {(m.role === "user" || (m.text?.trim() && !m.simResult)) && (
              <div style={{ display:"flex", flexDirection:"column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: m.role === "user" ? "75%" : "100%", padding:"12px 16px", borderRadius:12,
                  background: m.role === "user" ? C.brand : T.cardElevated,
                  color: m.role === "user" ? "#fff" : C.ink,
                  border: m.role === "user" ? "none" : `1px solid ${C.line}`,
                  fontSize:13, lineHeight:1.6, boxShadow: m.role === "user" ? "none" : T.shadow1 }}>
                  {m.role === "user" ? m.text : (
                    <div className="markdown-body" style={{ margin:0, padding:0, fontSize:13, overflowX:"auto", wordBreak:"break-word" }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>
                  )}
                  {m.role === "agent" && !m.isStreaming && m.sources && <SourcesDisclosure sources={m.sources} />}
                </div>
              </div>
              )}

              {/* Options (radio cards) — only on last visible message */}
              {m.role === "agent" && !m.isStreaming && m.options && m.options.length > 1 && i === filtered.length - 1 && (
                <div style={{ marginTop:8 }}>
                  <SimOptionCards options={m.options} onSelect={handleOptionSelect} />
                  {/* Custom input commented out
                  <div style={{ background:T.cardElevated, border:`1.5px solid ${C.line2}`, borderRadius:10, padding:"10px 12px", marginTop:6, display:"flex", alignItems:"center", gap:10, cursor:"text", transition:`border-color .15s ${T.ease}` }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.line2}
                    onClick={e => e.currentTarget.querySelector("input")?.focus()}>
                    <div style={{ width:20, height:20, borderRadius:999, border:`2px solid ${C.line2}`, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <input
                        placeholder="Type your own what-if scenario and press Enter…"
                        style={{ width:"100%", border:"none", outline:"none", fontSize:12.5, fontFamily:FONT, color:C.ink2, background:"transparent", padding:0, minWidth:0 }}
                        onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) { handleSend(e.target.value.trim()); e.target.value = ""; } }}
                      />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); const inp = e.currentTarget.parentElement.querySelector("input"); if (inp?.value.trim()) { handleSend(inp.value.trim()); inp.value = ""; } }}
                      style={{ width:28, height:28, borderRadius:999, background:T.goldFoil, border:"none", cursor:"pointer", display:"grid", placeItems:"center", flexShrink:0, boxShadow:T.shadowGoldGlow }}>
                      <Send size={12} color={C.navBg} />
                    </button>
                  </div>
                  */}
                </div>
              )}
              {m.role === "agent" && !m.isStreaming && m.options && m.options.length === 1 && i === filtered.length - 1 && (
                <AutoSelectOption text={m.options[0].text} onSelect={handleOptionSelect} />
              )}
              {m.role === "agent" && m.isStreaming && m.isSkeletonOptions && (
                <div style={{ marginTop:8 }}><SignalSkeletonOptions /></div>
              )}

              {/* Simulation result cards — always show (historical results stay visible) */}
              {m.role === "agent" && !m.isStreaming && m.simResult && (
                <div style={{ marginTop:16 }}>
                  <SimResultCards result={m.simResult} urgencyColor={urgencyColor} toast={toast} query={firstQuery} saving={saving} setSaving={setSaving} onCreateBrief={onCreateBrief} allMessages={messages} />
                </div>
              )}
            </div>
          )); })()}

          {/* Thinking indicator */}
          {loading && !messages.some(m => m.role === "agent" && m.isStreaming && m.text) && (
            <ThinkingIndicator />
          )}

          {/* Go to Deep Simulation — persistent after first sim result */}
          {lastSimResult && go && (
            <div style={{ display:"flex", gap:10, paddingTop:16, marginTop:8, borderTop:`1px solid ${C.line}` }}>
              <Btn kind="gold" onClick={() => go("decision-deep")}><Activity size={13} /> Go to Deep Simulation</Btn>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      )}

      </div>{/* /main content */}
      </div>{/* /flex row */}

      {/* Fixed floating input bar at bottom when messages exist */}
      {messages.length > 0 && (
        <div style={{ position:"fixed", bottom:0, left:barPos.left, width:barPos.width, background:`linear-gradient(transparent, ${C.bg} 30%)`, padding:"24px 0 16px", zIndex:100 }}>
          {inputBar}
        </div>
      )}
    </div>
  );
}

function AutoSelectOption({ text, onSelect }) {
  const fired = useRef(false);
  useEffect(() => { if (!fired.current) { fired.current = true; setTimeout(() => onSelect(text), 500); } }, []);
  return null;
}

function SimOptionCards({ options, onSelect }) {
  const [selectedId, setSelectedId] = useState(null);
  const handleSelect = (id, text) => { setSelectedId(id); setTimeout(() => onSelect(text), 500); };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {options.map((opt, i) => {
        if (selectedId && selectedId !== opt.id) return null;
        const isSel = selectedId === opt.id;
        return (
          <button key={opt.id || i} onClick={() => !selectedId && handleSelect(opt.id, opt.text)}
            style={{ background: isSel ? `${C.gold}14` : T.cardElevated, border:`1.5px solid ${isSel ? C.gold : C.line2}`, borderRadius:10,
              padding:"10px 12px", cursor: selectedId ? "default" : "pointer", textAlign:"left", fontFamily:FONT,
              transition:`all .2s ${T.ease}`, display:"flex", alignItems:"flex-start", gap:10, width:"100%",
              boxShadow: isSel ? `0 0 0 1px ${C.gold}40` : "0 1px 3px rgba(0,0,0,0.04)" }}
            onMouseEnter={e => { if (!selectedId) { e.currentTarget.style.borderColor = C.goldDk; e.currentTarget.style.background = `${C.gold}08`; e.currentTarget.style.boxShadow = `0 2px 8px ${C.gold}18`; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { if (!selectedId) { e.currentTarget.style.borderColor = C.line2; e.currentTarget.style.background = T.cardElevated; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; } }}>
            <div style={{ width:16, height:16, borderRadius:999, border:`2px solid ${isSel ? C.gold : C.line2}`,
              background: isSel ? C.gold : "transparent", display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, marginTop:1, transition:"all .2s ease" }}>
              {isSel && <div style={{ width:6, height:6, borderRadius:999, background:"#fff" }} />}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.ink, lineHeight:1.4 }}>{opt.text}</div>
              {opt.description && <div style={{ fontSize:11.5, color:C.muted, marginTop:3, lineHeight:1.4 }}>{opt.description}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SimResultCards({ result, urgencyColor, toast, query, saving, setSaving, onCreateBrief, allMessages }) {
  const [showThinking, setShowThinking] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);

  const buildConversationTrail = () => {
    if (!allMessages || !allMessages.length) return { trail: null, sources: null };
    const trail = [];
    let allSources = [];
    for (let i = 0; i < allMessages.length; i++) {
      const m = allMessages[i];
      const entry = { role: m.role, text: m.text || "" };
      if (m.options && m.options.length > 0) {
        entry.options_offered = m.options.map(o => ({ text: o.text, description: o.description || "" }));
        const nextUser = allMessages[i + 1];
        if (nextUser && nextUser.role === "user") entry.option_selected = nextUser.text;
      }
      const msgSources = [];
      if (m.sources) {
        const srcList = m.sources.data_used || (Array.isArray(m.sources) ? m.sources : []);
        if (Array.isArray(srcList) && srcList.length) {
          msgSources.push(...srcList);
          if (m.sources.reasoning) entry.reasoning = m.sources.reasoning;
        }
      }
      if (m.simResult && m.simResult.sources) {
        const srcList = m.simResult.sources.data_used || (Array.isArray(m.simResult.sources) ? m.simResult.sources : []);
        if (Array.isArray(srcList) && srcList.length) msgSources.push(...srcList);
        if (m.simResult.sources.reasoning) entry.reasoning = entry.reasoning || m.simResult.sources.reasoning;
      }
      if (msgSources.length) {
        entry.sources = msgSources.map(s => ({ source: s.source || s.name, detail: s.detail, confidence: s.confidence }));
        allSources.push(...msgSources);
      }
      if (m.simResult) {
        entry.has_sim_result = true;
        if (m.simResult.verdict) entry.verdict = m.simResult.verdict;
        if (m.simResult.key_metrics) entry.metrics = m.simResult.key_metrics;
      }
      trail.push(entry);
    }
    return { trail, sources: allSources.length > 0 ? allSources : null };
  };
  return (
    <div style={{ animation:"fadeIn 0.5s ease-out" }}>
      {/* Thinking Steps */}
      {result.thinking_steps && result.thinking_steps.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <button onClick={() => setShowThinking(!showThinking)}
            style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none",
              cursor:"pointer", fontFamily:FONT, fontSize:12.5, fontWeight:600, color:C.brandLt, padding:0, marginBottom:8 }}>
            <BarChart3 size={14} />
            {showThinking ? "Hide" : "Show"} Companion reasoning ({result.thinking_steps.length} steps)
            {showThinking ? <ChevronLeft size={14} style={{ transform:"rotate(-90deg)" }} /> : <ChevronRight size={14} style={{ transform:"rotate(90deg)" }} />}
          </button>
          {showThinking && (
            <div style={{ background:C.paper, border:`1px solid ${C.line}`, borderRadius:10, padding:"14px 16px" }}>
              {result.thinking_steps.map((ts, i) => (
                <div key={i} style={{ marginBottom: i < result.thinking_steps.length - 1 ? 12 : 0,
                  paddingBottom: i < result.thinking_steps.length - 1 ? 12 : 0,
                  borderBottom: i < result.thinking_steps.length - 1 ? `1px dashed ${C.line}` : "none" }}>
                  <span style={{ fontSize:10, fontWeight:700, color:"#fff", background:C.brand,
                    padding:"3px 8px", borderRadius:5, display:"inline-block", marginBottom:6 }}>
                    {ts.step}
                  </span>
                  <div style={{ fontSize:12.5, color:C.ink2, lineHeight:1.55 }}>{ts.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verdict */}
      <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"24px 28px", marginBottom:22, boxShadow:T.shadow2, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:T.goldFoil }} />
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <span style={{ width:18, height:1, background:T.goldFoil }} />
          <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Companion Verdict</span>
        </div>
        <div style={{ fontSize:15, color:C.ink, lineHeight:1.7 }}>{result.verdict}</div>
      </div>

      {/* Key Metrics */}
      {result.key_metrics && result.key_metrics.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(result.key_metrics.length,4)},1fr)`, gap:14, marginBottom:22 }}>
          {result.key_metrics.map((m, i) => (
            <div key={i} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background: m.positive ? C.green : C.red, opacity:.55 }} />
              <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.muted, fontWeight:700, marginBottom:10, textTransform:"uppercase" }}>{m.label}</div>
              <div style={{ fontFamily:DISP, fontSize:28, fontWeight:600, color:C.ink, letterSpacing:"-.02em", lineHeight:1.05 }}>{m.value}</div>
              {m.delta && <div style={{ fontSize:12, fontWeight:700, marginTop:6, color:m.positive?C.green:C.red }}>{m.delta}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations + Outcomes two-column layout */}
      {(result.recommendations?.length > 0 || result.key_metrics?.length > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"7fr 5fr", gap:16, marginBottom:22 }}>
          {/* Left: Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 26px", boxShadow:T.shadow1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <span style={{ width:18, height:1, background:T.goldFoil }} />
                <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Recommended Actions</span>
              </div>
              {result.recommendations.map((r, i) => (
                <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start",
                  padding:"14px 0", borderTop: i>0 ? `1px solid ${C.line}` : "none" }}>
                  <span style={{ fontSize:9, fontWeight:700, padding:"4px 9px", borderRadius:T.radSm,
                    color:urgencyColor(r.urgency), background:`${urgencyColor(r.urgency)}12`,
                    border:`1px solid ${urgencyColor(r.urgency)}33`, whiteSpace:"nowrap", flexShrink:0, marginTop:3, letterSpacing:".14em", minWidth:60, textAlign:"center" }}>
                    {(r.urgency || "medium").toUpperCase()}
                  </span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, color:C.ink, fontWeight:600, lineHeight:1.5 }}>{r.action}</div>
                    <div style={{ fontSize:12.5, color:C.muted, marginTop:4, lineHeight:1.55 }}>{r.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Right: Outcomes */}
          <div style={{ background:T.cardElevated, border:`1px solid ${C.gold}44`, borderRadius:T.radLg, padding:"22px 26px", boxShadow:T.shadow1, display:"flex", flexDirection:"column", gap:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ width:18, height:1, background:T.goldFoil }} />
              <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Simulation Outcomes</span>
            </div>
            {result.key_metrics && result.key_metrics.map((m, i) => (
              <div key={i} style={{ padding:"14px 0", borderTop: i>0 ? `1px solid ${C.line}` : "none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:12, color:C.muted, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase", marginBottom:4 }}>{m.label}</div>
                  {m.delta && <div style={{ fontSize:11, color:m.positive?C.green:C.red, fontWeight:600 }}>{m.delta}</div>}
                </div>
                <div style={{ fontFamily:DISP, fontSize:22, fontWeight:600, color:m.positive?C.green:C.ink, letterSpacing:"-.02em" }}>{m.value}</div>
              </div>
            ))}
            <div style={{ marginTop:16, padding:"14px 16px", background:`${C.gold}08`, borderRadius:T.radSm, border:`1px solid ${C.gold}22` }}>
              <div style={{ fontSize:11.5, color:C.ink2, lineHeight:1.55 }}>{result.verdict?.slice(0, 200)}{result.verdict?.length > 200 ? "…" : ""}</div>
            </div>
          </div>
        </div>
      )}

      {/* Sources & Reasoning */}
      {result.sources && <SourcesDisclosure sources={result.sources} />}

      {/* Save + Brief + Push */}
      <div style={{ paddingTop:16, borderTop:`1px solid ${C.line}`, display:"flex", justifyContent:"flex-end", gap:8 }}>
        <Btn kind="ghost" small onClick={() => setShowPushModal(true)}><Send size={13} /> Push to subordinate</Btn>
        {onCreateBrief && <Btn kind="ghost" small onClick={() => onCreateBrief({
          context_type: "simulation",
          context_data: { verdict: result.verdict || "", key_metrics: result.key_metrics || [], recommendations: (result.recommendations || []).map(r => typeof r === "string" ? r : r.text || r.action || ""), query }
        })}><FileEdit size={13} /> Create Alignment Brief</Btn>}
        <Btn kind="ghost" small disabled={saving} onClick={async () => {
          setSaving(true);
          try {
            const { trail, sources } = buildConversationTrail();
            const resultSources = result.sources ? (result.sources.data_used || (Array.isArray(result.sources) ? result.sources : [])) : [];
            const allSources = [...(sources || []), ...resultSources];
            await saveSimulationAsMemory({
              simulation_title: query,
              simulation_summary: result.verdict || "",
              simulation_type: "lite",
              query,
              metrics: result.key_metrics || [],
              recommendations: (result.recommendations || []).map(r => typeof r === "string" ? r : r.text || r.action || ""),
              conversation_trail: trail,
              sources_used: allSources.length > 0 ? allSources : null,
            });
            toast.push({ tone:"success", title:"Saved to Memory", body:"Simulation saved as in-motion initiative in Memory." });
          } catch (e) {
            toast.push({ tone:"error", title:"Save failed", body: e.message });
          } finally { setSaving(false); }
        }}>{saving ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> Saving...</> : "Save as initiative"}</Btn>
      </div>

      {showPushModal && (() => {
        const members = [
          { name: "VP Automotive Sales", role: "K. Tate (account ownership for T1 OEMs)" },
          { name: "VP Revenue Management", role: "R. Patel (pricing lever authority)" },
          { name: "Head of ABM", role: "Marketing lead for Automotive segment campaigns" },
          { name: "Industry Expert, Automotive", role: "Detroit-based field specialist" },
          { name: "UPS Capital", role: "Trade-finance attach for Aptiv and Stellantis plays" },
        ];
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={e => { if (e.target === e.currentTarget) setShowPushModal(false); }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)" }} />
            <div style={{ position: "relative", background: T.cardElevated, border: `1px solid ${C.gold}44`, borderRadius: 14, padding: 0, width: 420, maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.goldFoil, borderRadius: "14px 14px 0 0" }} />
              <div style={{ padding: "22px 24px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.goldDk, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Push to Subordinate</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Share simulation results with the execution team</div>
                  </div>
                  <button onClick={() => setShowPushModal(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
                </div>
              </div>
              <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 6 }}>
                {members.map((mem, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `${C.gold}06`, border: `1px solid ${C.gold}20`, borderRadius: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 999, background: `${C.gold}18`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Users size={14} color={C.goldDk} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{mem.name}</div>
                      <div style={{ fontSize: 10.5, color: C.muted }}>{mem.role}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: `1px solid ${C.line}` }}>
                <Btn kind="ghost" small onClick={() => setShowPushModal(false)}>Cancel</Btn>
                <Btn kind="gold" onClick={() => {
                  setShowPushModal(false);
                  toast.push({ tone: "success", title: "Pushed", body: `Simulation results sent to ${members.length} team members.` });
                }}><Send size={13} /> Push</Btn>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function SimulatorView({ go }) {
  const [levers, setLevers] = useState(LEVERS_INIT);
  const [budget, setBudget] = useState(7.2);
  const [scenario, setScenario] = useState("reco");

  const hybrid = useMemo(() => {
    const sel = levers.filter((l) => l.on);
    const base = sel.reduce((s, l) => s + l.gap, 0);
    const synergy = levers.find((l) => l.id === "digital").on && levers.find((l) => l.id === "onboard").on ? 4 : 0;
    const factor = 0.85 + 0.30 * ((budget - 2) / 10);
    return Math.max(0, Math.min(95, Math.round((base + synergy) * factor)));
  }, [levers, budget]);

  const toggle = (id) => setLevers((ls) => ls.map((l) => l.id === id ? { ...l, on: !l.on } : l));

  return (
    <div>
      <ShellTop onBack={() => go("investigate")} />
      <div style={{ display: "grid", gridTemplateColumns: "0.78fr 1.22fr", gap: 22 }}>
          {/* chat */}
          <div>
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 6 }}>You · 11:24 AM</div>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.45 }}>
                Model which recovery plan closes the SMB backfill gap without damaging customer trust or overloading the network.
              </div>
            </div>
            <div style={{ background: C.paper, border: `1px solid ${C.line2}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, color: C.goldDk, marginBottom: 6, fontWeight: 600 }}>CXO-OS · 11:25 AM</div>
              <div style={{ fontSize: 13.5, color: C.ink2, lineHeight: 1.5 }}>
                Got it. I'll run scenario modeling using the TwinX Commercial Growth Simulator with cohort, sentiment
                and network-capacity signals.
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 8, fontStyle: "italic" }}>Running simulations…</div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 600 }}>4 steps completed</div>
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 6 }}>You · 11:26 AM</div>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.45 }}>
                Great — what's the best plan, and what's the expected lift on 90-day retention and sentiment?
              </div>
            </div>
            {/* expected lift */}
            <div style={{ background: C.brand, color: "#fff", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, letterSpacing: ".12em", color: C.gold, fontWeight: 700, marginBottom: 12 }}>
                EXPECTED LIFT · RECOMMENDED PLAN
              </div>
              {[["90-day account retention", "+6.1 pts"], ["New-customer sentiment", "+9 pts"], ["Blended SMB CAC", "−7%"]].map(([a, b]) => (
                <div key={a} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0",
                  borderTop: "1px solid #FFFFFF1A", fontSize: 13.5 }}>
                  <span style={{ color: C.faint }}>{a}</span>
                  <span style={{ fontWeight: 600, color: C.gold, fontFamily: DISP }}>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* workbench */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 28, color: C.ink, letterSpacing:"-.015em" }}>TwinX Commercial Growth Simulator</div>
                <div style={{ fontSize: 13, color: C.muted, margin: "6px 0", maxWidth: 560, lineHeight: 1.5 }}>
                  A workbench for pressure-testing recovery paths. You decide the strategy — TwinX helps you see the tradeoffs.
                </div>
              </div>
              <span style={{ fontSize: 10.5, letterSpacing: ".14em", color: C.muted, border: `1px solid ${C.line2}`,
                borderRadius: 999, padding: "5px 11px", fontWeight: 700 }}>WORKBENCH</span>
            </div>

            <div style={{ background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 10, padding: "11px 14px",
              margin: "12px 0 18px", display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: C.ink }}>
              <span style={{ width: 16, height: 16, borderRadius: 999, border: `4px solid ${C.green}`, flexShrink: 0 }} />
              <span><b>Goal:</b> Close the 4.8% SMB backfill gap while protecting customer trust and network economics.</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* scenario library */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: C.ink, marginBottom: 10 }}>
                  SCENARIO LIBRARY <span style={{ color: C.faint, fontWeight: 500 }}>— start from a template</span>
                </div>
                {SCENARIOS.map((s) => {
                  const on = scenario === s.id;
                  return (
                    <button key={s.id} onClick={() => setScenario(s.id)} style={{ width: "100%", textAlign: "left",
                      background: on ? C.greenBg : "#fff", border: `1.5px solid ${on ? C.green : C.line}`, borderRadius: 10,
                      padding: "12px 14px", marginBottom: 10, cursor: "pointer", display: "flex",
                      justifyContent: "space-between", alignItems: "center", fontFamily: FONT }}>
                      <span>
                        <span style={{ fontWeight: 600, fontSize: 14, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
                          {on && <span style={{ width: 6, height: 6, borderRadius: 999, background: C.green }} />}{s.title}
                        </span>
                        <span style={{ fontSize: 11.5, color: C.muted }}>{s.sub}</span>
                      </span>
                      <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 17, color: on ? C.green : C.ink2 }}>{s.pct}%</span>
                    </button>
                  );
                })}
                <div style={{ background: C.card, border: `1.5px solid ${C.gold}`, borderRadius: 10, padding: "12px 14px",
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>Custom Hybrid</span>
                    <span style={{ display: "block", fontSize: 11.5, color: C.muted }}>Your live combination of levers</span>
                  </span>
                  <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 19, color: C.goldDk }}>{hybrid}%</span>
                </div>
              </div>

              {/* hybrid levers */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: C.ink, marginBottom: 10 }}>
                  HYBRID PLAN <span style={{ color: C.faint, fontWeight: 500 }}>— combine levers</span>
                </div>
                {levers.map((l) => (
                  <button key={l.id} onClick={() => toggle(l.id)} style={{ width: "100%", textAlign: "left",
                    background: l.on ? "#fff" : C.paper, border: `1px solid ${l.on ? C.gold : C.line}`, borderRadius: 9,
                    padding: "11px 12px", marginBottom: 9, cursor: "pointer", display: "flex", alignItems: "center",
                    gap: 11, fontFamily: FONT }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      background: l.on ? C.gold : "#fff", border: `1.5px solid ${l.on ? C.gold : C.line2}`,
                      display: "grid", placeItems: "center", color: C.brand, fontSize: 12, fontWeight: 900 }}>
                      {l.on ? "✓" : ""}
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: C.ink }}>{l.label}</span>
                      <span style={{ display: "block", fontSize: 11, color: C.muted }}>{l.meta}</span>
                    </span>
                  </button>
                ))}
                <Btn kind="primary" small onClick={() => {}}>✓ Save hybrid scenario</Btn>
              </div>
            </div>

            {/* controls + compare */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 22 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: C.ink, marginBottom: 12 }}>CONTROLS</div>
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
                    <span style={{ color: C.ink2, fontWeight: 500 }}>Budget</span>
                    <span style={{ fontWeight: 600, color: C.ink, fontFamily: DISP }}>${budget.toFixed(1)}M / quarter</span>
                  </div>
                  <input type="range" min={2} max={12} step={0.1} value={budget}
                    onChange={(e) => setBudget(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: C.gold }} />
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 8 }}>Within budget · scales lever effectiveness</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: C.ink, marginBottom: 12 }}>COMPARE PATHS</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["DO NOTHING", 0, false], ["RECOMMENDED", 62, true], ["YOUR HYBRID", hybrid, false]].map(([n, v, rec]) => (
                    <div key={n} style={{ flex: 1, background: C.card, borderRadius: 10, padding: "12px 8px", textAlign: "center",
                      border: `1.5px solid ${rec ? C.green : C.line}` }}>
                      <div style={{ fontSize: 10, letterSpacing: ".05em", color: C.muted, fontWeight: 700 }}>{n}</div>
                      <div style={{ fontFamily: DISP, fontSize: 24, fontWeight: 600, color: rec ? C.green : (n === "YOUR HYBRID" ? C.goldDk : C.ink2), marginTop: 4 }}>{v}%</div>
                      <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>gap closed</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DataFootnote />
          </div>
        </div>
      </div>
  );
}

/* ------------------------------------------------------------------ SIGNALS */
function SignalsView({ go, onSelectSignal }) {
  const [tab, setTab] = useState("market");
  const [signals, setSignals] = useState([]);
  const [mktSignals, setMktSignals] = useState([]);
  const [mktFilter, setMktFilter] = useState("All");

  React.useEffect(() => {
    fetchSignals().then(setSignals).catch(console.error);
    fetchMarketSignals().then(setMktSignals).catch(console.error);
  }, []);

  const signalCards = signals.filter(s => !s.is_row2);
  const signalRow2 = signals.filter(s => s.is_row2);
  const mktTypes = ["All", ...new Set(mktSignals.map(s => s.type))];
  const filteredMkt = mktFilter === "All" ? mktSignals : mktSignals.filter(s => s.type === mktFilter);

  const impactColor = (imp) => imp === "high" ? C.red : imp === "med" ? C.amber : C.green;
  const impactBg = (imp) => imp === "high" ? C.redBg : imp === "med" ? C.amberBg : C.greenBg;
  const confColor = (c) => c >= 0.9 ? C.green : c >= 0.8 ? C.amber : C.muted;

  return (
    <div>
      <ShellTop />
      <CenterTitle />

      {/* Hero */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <span style={{ width:20, height:1, background:T.goldFoil }} />
          <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Signals & Intelligence</span>
        </div>
        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:32, color:C.ink, letterSpacing:"-.02em", lineHeight:1.05, marginBottom:8 }}>
          What the market is telling you.
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {/* <div style={{ fontSize:14, color:C.muted, maxWidth:640, lineHeight:1.6 }}>
            Real-time signals across markets, accounts, and competitive movement. Filtered through your CCO lens.
          </div> */}
          <div style={{ fontSize:14, color:C.muted, maxWidth:640, lineHeight:1.6 }}>
            Real-time signals across markets, accounts, and competitive movement.
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <span style={{ fontSize:10.5, color:C.faint, letterSpacing:".02em" }}>Last refreshed: {(() => { const d = new Date(Date.now() - 90 * 60000); return d.toLocaleDateString("en-US", { timeZone: EST_TZ, weekday:"short", month:"short", day:"numeric", year:"numeric" }) + " · " + d.toLocaleTimeString("en-US", { timeZone: EST_TZ, hour:"2-digit", minute:"2-digit" }) + " EST"; })()}</span>
            <button onClick={() => {}} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
              background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radPill, cursor:"pointer",
              fontSize:11, fontWeight:600, color:C.ink2, fontFamily:FONT,
              transition:`border-color .2s ${T.ease}, color .2s ${T.ease}` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.ink; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.ink2; }}>
              <RotateCcw size={13} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{ display:"flex", gap:0, marginBottom:24, background:C.paper, borderRadius:T.radMd, padding:4, width:"fit-content", border:`1px solid ${C.line}` }}>
        {[["market", "Market Intelligence"], /* ["signals", "Top Signals"], */ ["kpis", "KPIs"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ fontSize:12, fontWeight:600, padding:"9px 18px",
            borderRadius:T.radSm, cursor:"pointer", fontFamily:FONT, letterSpacing:".02em",
            background: tab === k ? C.card : "transparent", color: tab === k ? C.ink : C.muted,
            border:"none", boxShadow: tab === k ? T.shadow1 : "none", transition:`all .2s ${T.ease}` }}>{l}</button>
        ))}
      </div>

      {tab === "kpis" ? <KpiOverview /> : tab === "market" ? (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${C.line}` }}>
            <div>
              {/* <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ width:14, height:1, background:T.goldFoil }} />
                <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Automotive · Live Feed</span>
              </div> */}
              <div style={{ fontFamily:DISP, fontWeight:600, fontSize:24, color:C.ink, letterSpacing:"-.01em" }}>Market Intelligence</div>
            </div>
            <span style={{ fontSize:10.5, color:C.faint, letterSpacing:".14em", fontWeight:600, textTransform:"uppercase" }}>{mktSignals.length} active · streaming</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
            {mktTypes.map(t => (
              <button key={t} onClick={() => setMktFilter(t)} style={{ fontSize:11.5, fontWeight: mktFilter === t ? 700 : 500,
                padding:"7px 14px", borderRadius:T.radPill, cursor:"pointer", fontFamily:FONT, letterSpacing:".02em",
                background: mktFilter === t ? C.ink : C.card, color: mktFilter === t ? "#fff" : C.ink2,
                border: `1px solid ${mktFilter === t ? C.ink : C.line}`, transition:`all .2s ${T.ease}`,
                boxShadow: mktFilter === t ? T.shadow1 : "none" }}>{t}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {filteredMkt.map((s) => (
              <div key={s.id} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:22,
                display:"flex", flexDirection:"column", boxShadow:T.shadow1, cursor:"pointer", position:"relative", overflow:"hidden",
                transition:`transform .2s ${T.ease}, box-shadow .2s ${T.ease}` }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadow2; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow1; }}
                onClick={() => { fetchMarketSignalDetail(s.id).then(detail => { onSelectSignal(detail); go("signalDetail"); }).catch(() => { onSelectSignal(s); go("signalDetail"); }); }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:impactColor(s.impact), opacity:.6 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", padding: "3px 8px", borderRadius: 6,
                      background: s.type === "RFP" ? `${C.brandLt}18` : s.type === "Competitor" ? C.redBg : s.type === "M&A" ? C.amberBg
                        : s.type === "Tariff" ? C.amberBg : s.type === "Earnings" ? C.greenBg : s.type === "Exec Move" ? `${C.brand}15`
                        : s.type === "Plant" ? C.greenBg : s.type === "Production" ? `${C.brandLt}15` : C.paper,
                      color: s.type === "RFP" ? C.brandLt : s.type === "Competitor" ? C.red : s.type === "M&A" ? C.amber
                        : s.type === "Tariff" ? C.goldDk : s.type === "Earnings" ? C.green : s.type === "Exec Move" ? C.brand
                        : s.type === "Plant" ? C.green : s.type === "Production" ? C.brandLt : C.ink2
                    }}>{s.type.toUpperCase()}</span>
                    <span style={{ fontSize: 10.5, color: C.faint }}>{s.time}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                      background: impactBg(s.impact), color: impactColor(s.impact) }}>
                      {s.impact === "high" ? "HIGH" : "MED"} IMPACT
                    </span>
                  </div>
                </div>

                <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 16.5, color: C.ink, lineHeight: 1.3, marginBottom: 10 }}>{s.title}</div>

                <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginBottom: 12, flex: 1 }}>
                  <b style={{ color: C.ink2 }}>Why:</b> {s.why.length > 180 ? s.why.slice(0, 180) + "..." : s.why}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                  {(s.accounts || []).slice(0, 3).map(a => (
                    <span key={a} style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                      background: C.paper, color: C.ink2, border: `1px solid ${C.line}` }}>
                      <Building2 size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />{a}
                    </span>
                  ))}
                  {(s.accounts || []).length > 3 && (
                    <span style={{ fontSize: 10.5, color: C.muted, padding: "3px 6px" }}>+{s.accounts.length - 3} more</span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px dashed ${C.line2}`, paddingTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10.5, color: C.faint }}>Source: {s.source}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: confColor(s.conf) }} />
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: confColor(s.conf) }}>{Math.round(s.conf * 100)}%</span>
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.brandLt, display: "flex", alignItems: "center", gap: 4 }}>
                    Details <ArrowRight size={12} />
                  </span>
                </div>

                <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 11px", marginTop: 10 }}>
                  <div style={{ fontSize: 9.5, letterSpacing: ".12em", color: C.goldDk, fontWeight: 700, marginBottom: 3 }}>RECOMMENDED ACTION</div>
                  <div style={{ fontSize: 11.5, color: C.ink2, lineHeight: 1.4 }}>{s.action.length > 120 ? s.action.slice(0, 120) + "..." : s.action}</div>
                </div>
              </div>
            ))}
          </div>
          <DataFootnote />
        </>
      ) : null /* Top Signals tab commented out
      (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 22, color: C.ink }}>Highlights of the day
              <div style={{ width: 56, height: 3, background: C.gold, borderRadius: 2, marginTop: 6 }} />
            </div>
            <span style={{ fontSize: 11.5, color: C.faint }}>Ranked by QoQ movement · All KPIs</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {signalCards.map((s, i) => {
              const k = toneColor(s.tone);
              return (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, padding: 18,
                  display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 17, color: C.ink, lineHeight: 1.25 }}>{s.title}</span>
                    <Pill tone={s.tone}>{s.tag}</Pill>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".03em", color: C.ink2,
                      border: `1px solid ${C.line2}`, borderRadius: 7, padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Activity size={12} color={C.muted} /> {s.metric}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 12.5, color: s.delta_neg ? C.red : C.green }}>{s.delta}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.55, marginBottom: 10 }}>{s.desc}</div>
                  <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginBottom: 12 }}>
                    <b style={{ color: C.ink2 }}>Why it matters:</b> {s.why}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.faint, display: "flex", justifyContent: "space-between",
                    alignItems: "center", gap: 8, borderTop: `1px dashed ${C.line2}`, paddingTop: 11, marginBottom: s.rows.length ? 14 : 0 }}>
                    <span>Source: {s.src} · {s.timestamp || s.ago}</span>
                    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3, color: C.muted }}><Copy size={12} /> Copy</span>
                    </span>
                  </div>
                  {s.rows.length > 0 && (
                    <>
                      <div style={{ fontSize: 12.5, lineHeight: 1.9 }}>
                        {s.rows.map(([a, b]) => (
                          <div key={a} style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 6 }}>
                            <span style={{ color: C.muted }}>{a}</span><span style={{ color: C.ink2 }}>{b}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", marginTop: 12 }}>
                        <div style={{ fontSize: 10, letterSpacing: ".12em", color: C.goldDk, fontWeight: 700, marginBottom: 4 }}>SUGGESTED NEXT ACTION</div>
                        <div style={{ fontSize: 12.5, color: C.ink2 }}>{s.next_action}</div>
                      </div>
                    </>
                  )}
                  {s.open && (
                    <button onClick={() => go("signalDetail")} style={{ marginTop: 14, background: "none", border: "none",
                      color: C.brandLt, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT,
                      display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
                      Open full signal <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 16 }}>
            {signalRow2.map((s) => (
              <div key={s.title} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, padding: "18px 18px 22px",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 17, color: C.ink, lineHeight: 1.25 }}>{s.title}</span>
                <Pill tone={s.tone}>{s.tag}</Pill>
              </div>
            ))}
          </div>
          <DataFootnote />
        </>
      ) */}
    </div>
  );
}

function KpiOverview() {
  const [kpis, setKpis] = useState([]);
  React.useEffect(() => {
    fetchKPIs().then(setKpis).catch(console.error);
  }, []);
  const chipColor = (c) =>
    ["Yield", "SMB", "Healthcare"].includes(c) ? C.green :
    ["Volume", "Margin"].includes(c) ? C.red :
    ["International", "Revenue"].includes(c) ? C.brandLt : C.amber;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 22, color: C.ink }}>KPI movement overview · <span style={{ color: C.goldDk }}>Q1 2026</span></div>
        <span style={{ fontSize: 11.5, color: C.faint }}>QoQ / YoY lens · All KPIs · Source: UPS Q1 2026 Earnings</span>
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>Core commercial metrics with deltas matched to the selected comparison period.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "15px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{k.label}</span>
              <Spark data={k.spark} up={k.up} />
            </div>
            <div style={{ fontFamily: DISP, fontSize: 27, fontWeight: 600, color: C.ink, marginTop: 8, letterSpacing: "-.01em" }}>{k.val}</div>
            <div style={{ fontSize: 12.5, color: k.up ? C.green : C.red, fontWeight: 600, marginTop: 2 }}>{k.sub}</div>
            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 8, lineHeight: 1.45, minHeight: 32 }}>{k.note}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
                color: chipColor(k.chip), background: `${chipColor(k.chip)}14`, border: `1px solid ${chipColor(k.chip)}33` }}>{k.chip}</span>
              <span style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 3 }}><Copy size={11} /> Copy</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ SIGNAL DETAIL */
function SignalDetailView({ go, signal, onSectionChange }) {
  const sig = signal || {};

  // Section visibility tracking — IntersectionObserver fires onSectionChange
  // as user scrolls between Why/Insight/Activity/Topics/Takeaways sections
  React.useEffect(() => {
    if (!onSectionChange) return;
    const ids = ["why-it-matters", "signal-strength", "key-insight", "recent-activity", "related-topics", "recommended-takeaways"];
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          onSectionChange(visible[0].target.dataset.section);
        }
      },
      { threshold: [0.3, 0.6], rootMargin: "-80px 0px -40% 0px" }
    );
    ids.forEach(id => {
      const el = document.querySelector(`[data-section="${id}"]`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [signal?.id, onSectionChange]);
  const enr = sig.signal_enrichment || {};
  const inv = sig.investigation_payload || {};
  const isMarket = !!sig.conf || !!sig.signal_type;
  const confPct = (() => {
    const enrDS = enr.data_sources || [];
    let score = 50;
    if (sig.impact === "high" || sig.tone === "urgent") score += 15;
    else if (sig.impact === "med" || sig.tone === "amber") score += 8;
    else score += 4;
    const highSrc = enrDS.filter(d => d.confidence === "High").length;
    const medSrc = enrDS.filter(d => d.confidence === "Medium").length;
    score += Math.min(highSrc * 6, 24) + Math.min(medSrc * 3, 9);
    if (sig.delta) score += 5;
    if (enr.metrics) score += 4;
    if (enr.recommended_takeaways?.length) score += 3;
    if (sig.conf && sig.conf >= 0.95) score += 4;
    else if (sig.conf && sig.conf >= 0.85) score += 2;
    return Math.min(score, 99);
  })();
  const impactLabel = sig.impact === "high" ? "High Impact" : sig.impact === "med" ? "Medium Impact" : sig.tone === "urgent" ? "Urgent Signal" : sig.tone === "green" ? "Opportunity" : "Watch";
  const impactCol = sig.impact === "high" || sig.tone === "urgent" ? C.red : sig.impact === "med" || sig.tone === "amber" ? C.amber : C.green;
  const sigTitle = sig.title || "Signal Detail";
  const sigSource = sig.source || sig.src || "UPS Revenue Management";
  const sigTime = sig.time || sig.ago || sig.source_date || "Recent";
  const sigType = sig.signal_type || sig.type || sig.tag || "Signal";

  const whyText = enr.why_it_matters || inv.ai_response || sig.why || sig.body || "";
  const keyInsight = enr.key_insight || inv.context_summary || sig.why || "";

  const metrics = enr.metrics || (inv.kpis || []).map(k => ({
    value: k.val, label: k.label + (k.sub ? ` (${k.sub})` : ""),
    negative: !!k.neg, positive: !k.neg
  }));

  const activity = enr.recent_activity || [];

  const relatedTopics = enr.related_topics || inv.affected_accounts || sig.accounts || [];

  const takeaways = enr.recommended_takeaways || (inv.recommended_action ? [{
    action: inv.recommended_action,
    reasoning: "because this is the highest-priority recommended action based on the analysis.",
    impact: sig.recommended_action_summary || inv.recommended_action
  }] : sig.action ? [{
    action: sig.action,
    reasoning: "because addressing this signal now aligns with the current strategic window.",
    impact: "Strengthens competitive positioning and protects revenue in the affected segment."
  }] : []);

  const dataSources = enr.data_sources || (sigSource ? [{ name: sigSource, type: sig.analysis_by ? "Companion Analysis" : "Internal", confidence: sig.confidence || "High", updated: sigTime }] : []);
  const confDesc = enr.confidence_description || (sig.confidence ? `${sig.confidence} confidence — ${sig.analysis_by || "corroborated by multiple sources"}.` : confPct >= 90 ? "Very high confidence — multiple corroborating sources." : confPct >= 80 ? "High confidence — strong source credibility." : "Moderate confidence — additional verification recommended.");

  return (
    <div>
      <ShellTop onBack={() => go("signals")} />
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", padding: "3px 8px", borderRadius: 6,
              background: sig.tone === "urgent" ? C.redBg : sig.tone === "green" ? C.greenBg : C.amberBg,
              color: sig.tone === "urgent" ? C.red : sig.tone === "green" ? C.green : C.amber
            }}>{sigType.toUpperCase()}</span>
            <Pill tone={sig.tone || "amber"}>{impactLabel}</Pill>
          </div>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 26, color: C.ink, lineHeight: 1.2, maxWidth: 750, letterSpacing:"-.015em" }}>{sigTitle}</div>
        </div>
      </div>

      {/* ROW 1: Why it matters + Signal Strength */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, marginTop: 20 }}>
        <div data-section="why-it-matters" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ width: 4, height: 20, borderRadius: 2, background: sig.tone === "urgent" ? C.red : sig.tone === "green" ? C.green : C.amber }} />
            <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 19, color: C.ink }}>Why it matters</div>
          </div>
          <div style={{ fontSize: 13.5, color: C.ink2, lineHeight: 1.7, marginTop: 10 }}>{whyText}</div>
          {metrics.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(metrics.length, 3)}, 1fr)`, gap: 12, marginTop: 20 }}>
              {metrics.map((m, i) => (
                <div key={i} style={{ background: m.negative ? "#FEF2F2" : m.positive ? "#F0FDF4" : C.paper,
                  border: `1px solid ${m.negative ? "#FECACA" : m.positive ? "#BBF7D0" : C.line}`,
                  borderRadius: 10, padding: "16px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: DISP, fontSize: 22, fontWeight: 600, color: m.negative ? C.red : m.positive ? C.green : C.ink }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.3 }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div data-section="signal-strength" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, padding: 22, textAlign: "center" }}>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 15, color: C.ink, marginBottom: 16 }}>Signal Strength</div>
          <div style={{ width: 110, height: 110, borderRadius: 999, margin: "0 auto",
            border: `6px solid ${impactCol}`, display: "grid", placeItems: "center",
            background: `${impactCol}10` }}>
            <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 38, color: impactCol }}>{confPct}</span>
          </div>
          <div style={{ fontWeight: 600, color: impactCol, marginTop: 12, fontSize: 13 }}>{impactLabel}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.5, padding: "0 8px" }}>{confDesc}</div>
          <div style={{ marginTop: 14 }}><Btn kind="ghost" small>+ Follow Story</Btn></div>
        </div>
      </div>

      {/* ROW 2: Key Insight + Recent Activity + Related Topics — 3-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginTop: 18 }}>
        {/* Key Insight */}
        <div data-section="key-insight" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, padding: 22, borderTop: `3px solid ${C.red}` }}>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 16, color: C.ink, marginBottom: 12 }}>Key Insight</div>
          <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.65 }}>{keyInsight}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
            Source: {sigSource} | {sigTime}
          </div>
        </div>

        {/* Recent Activity */}
        <div data-section="recent-activity" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, padding: 22, borderTop: `3px solid ${C.brand}` }}>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 16, color: C.ink, marginBottom: 12 }}>Recent Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {activity.slice(0, 4).map((act, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 7, height: 7, borderRadius: 999, background: i === 0 ? C.ink : C.muted, marginTop: 5, flexShrink: 0 }} />
                <div style={{ fontSize: 12.5, color: C.ink2, lineHeight: 1.5 }}>
                  <span style={{ color: C.muted }}>{act.time}:</span> {act.action}
                </div>
              </div>
            ))}
          </div>
          {activity.length > 4 && (
            <div style={{ fontSize: 11.5, color: C.brand, marginTop: 14, cursor: "pointer", fontWeight: 500 }}>View all activity →</div>
          )}
        </div>

        {/* Related Topics */}
        <div data-section="related-topics" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, padding: 22, borderTop: `3px solid ${C.goldDk}` }}>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 16, color: C.ink, marginBottom: 12 }}>Related Topics</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {relatedTopics.map((topic, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.ink2 }}>
                <div style={{ width: 5, height: 5, borderRadius: 999, background: C.ink2, flexShrink: 0 }} />
                {topic}
              </div>
            ))}
          </div>
          {dataSources.length > 0 && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
              {dataSources.length} source{dataSources.length > 1 ? "s" : ""} · {dataSources.filter(d => d.confidence === "High").length} high confidence
            </div>
          )}
        </div>
      </div>

      {/* ROW 3: Recommended Takeaways — 2-column table layout */}
      {takeaways.length > 0 && (
        <div data-section="recommended-takeaways" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, padding: 24, marginTop: 18 }}>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 19, color: C.ink, marginBottom: 4 }}>Recommended Takeaways</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 18 }}>Conversations worth having — and the consensus they could unlock.</div>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>What we should do</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>Potential impact</div>
          </div>
          {/* Table rows */}
          {takeaways.map((tw, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, padding: "16px 0",
              borderBottom: i < takeaways.length - 1 ? `1px solid ${C.line}` : "none" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, border: `1.5px solid ${C.muted}`,
                  display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2, color: C.muted }}>
                  <Lightbulb size={13} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{tw.action}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginTop: 3 }}>{tw.reasoning}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, border: `1.5px solid ${C.green}`,
                  display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2, color: C.green }}>
                  <Check size={13} />
                </div>
                <div style={{ fontSize: 12.5, color: C.ink2, lineHeight: 1.55 }}>{tw.impact}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions bar */}
      <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
        <Btn kind="ghost" small onClick={() => {
          const q = `What is the impact of "${sigTitle}" and what should we do about it?`;
          go("decision-with-query", q);
        }}><Activity size={13} /> Model in Decision Lab</Btn>
        <Btn kind="ghost" small onClick={() => {
          const isFedExSignal = sigTitle.toLowerCase().includes("fedex");
          const invitePanel = isFedExSignal ? {
            key: "invite-team", label: "Invite team to investigate",
            title: "Invite team to investigate — Working Group",
            subtitle: "FedEx Auto Express Competitive Counter — NAAF Pre-Lock Execution",
            content_sections: [
              { heading: "Who to Include", body: "• **VP Automotive Sales** — K. Tate (Ford and Stellantis account ownership; routes the pre-lock offer to account teams)\n• **Head of NAAF Mexico** — Commercial launch lead; confirms capacity allocation for pre-lock commitment\n• **VP Revenue Management** — R. Patel (DIM Divisor guardrail authority; approves L0 floor change to 156)\n• **Industry Expert, Automotive (Detroit-based)** — Deploy to Ford and Stellantis immediately for executive engagement\n• **UPS Capital** — Trade-finance attach for Stellantis; confirms $2.8M incremental ARR modeling" },
              { heading: "Share Preview — What Gets Sent", body: "" },
              { heading: "Suggested Questions for the Group", body: [
                "• Is the August NAAF launch capacity firm enough to support 5 pre-committed routes across Ford and Stellantis? What is the contingency if the August date slips?",
                "• Does Stellantis procurement have a formal decision timeline for the carrier-mix review?",
              ].join("\n") },
            ],
            sharePreview: {
              title: "FedEx Auto Express Targets NAAF Mexico Corridors — They Are 8% Below UPS List",
              subtitle: "FedEx Auto Express · NAAF corridor overlap · 5-day pre-lock window",
              metrics: [
                { label: "FedEx Price Gap", val: "–8%", neg: true },
                { label: "FedEx Time Lead", val: "6 days", neg: true },
                { label: "Ford Gap", val: "–$30M", neg: true },
              ],
            },
            metrics: metrics.slice(0, 4).map(m => ({ label: m.label, val: m.value, sub: "" })),
          } : {
            key: "invite-team", label: "Invite team to investigate",
            title: `Invite team to investigate — ${sigTitle}`,
            subtitle: sigType,
            content_sections: [
              { heading: "Who to Include", body: "• **VP Automotive Sales** — K. Tate (Ford and Stellantis account ownership; routes the pre-lock offer to account teams)\n• **Head of NAAF Mexico** — Commercial launch lead; confirms capacity allocation for pre-lock commitment\n• **VP Revenue Management** — R. Patel (DIM Divisor guardrail authority; approves L0 floor change to 156)\n• **Industry Expert, Automotive (Detroit-based)** — Deploy to Ford and Stellantis immediately for executive engagement\n• **UPS Capital** — Trade-finance attach for Stellantis; confirms $2.8M incremental ARR modeling" },
              { heading: "Share Preview — What Gets Sent", body: `**Signal:** ${sigTitle}\n**Impact:** ${impactLabel}\n**Source:** ${sigSource} · ${sigTime}\n\n${(whyText || "").slice(0, 400)}` },
              { heading: "Suggested Questions for the Group", body: [
                `• What is our current exposure to "${sigTitle}" and which accounts are most affected?`,
                `• Do we have pricing or contract levers we can pull within the next 30 days to respond?`,
                `• How does this signal change our assumptions in the current quarter forecast?`,
                relatedTopics.length > 0 ? `• What's the latest engagement status with ${relatedTopics.slice(0, 2).join(" and ")}?` : `• Which accounts should we prioritize for outreach based on this signal?`,
                takeaways.length > 0 ? `• ${takeaways[0].action} — what resources or approvals do we need to execute?` : `• What's the recommended next step and who owns the decision?`,
              ].join("\n") },
            ],
            metrics: metrics.slice(0, 4).map(m => ({ label: m.label, val: m.value, sub: "" })),
          };
          const basePayload = sig.investigation_payload || {
            seed_question: `What should we do about: ${sigTitle}?`,
            ai_response: whyText,
            kpis: metrics.map(m => ({ label: m.label, val: m.value, sub: "", neg: !!m.negative })),
            follow_ups: takeaways.map(tw => ({ type: "chat", label: tw.action, prompt: tw.action })),
            affected_accounts: relatedTopics,
            context_summary: `${sigType} · ${sigTitle}`,
            recommended_action: takeaways.length > 0 ? takeaways[0].action : "",
            right_panel_views: [],
          };
          const payload = {
            ...basePayload,
            right_panel_views: [...(basePayload.right_panel_views || []).filter(v => v.key !== "invite-team"), invitePanel],
          };
          const syntheticAttention = {
            title: sigTitle,
            body: whyText,
            tag: sigType,
            signal_type: sigType,
            source: sigSource,
            source_date: sigTime,
            impact: sig.impact || "high",
            delta_value: sig.delta_value || "",
            related_account: relatedTopics.length > 0 ? relatedTopics.join(", ") : "",
            cta_label: "Investigate",
            cta_action: "investigate",
            _openInvitePanel: true,
            investigation_payload: payload,
          };
          go("investigate", syntheticAttention);
        }}><Users size={13} /> Investigate with Team</Btn>
        <Btn kind="ghost" small onClick={() => go("alignment-brief", {
          context_type: "signal",
          context_data: { title: sigTitle, signal_type: sigType, impact: sig.impact || "", why: whyText, source: sigSource, related_accounts: relatedTopics.join(", "), recommended_action: takeaways.length > 0 ? takeaways[0].action : "" }
        })}><FileEdit size={13} /> Create Alignment Brief</Btn>
      </div>
      <DataFootnote />
    </div>
  );
}

/* ------------------------------------------------------------------ ALIGNMENT BRIEF */
const BRIEF_STAKEHOLDERS = [
  { id: "CFO", label: "CFO", focus: "LTV & payback — durable retention, not just paid acquisition" },
  { id: "CEO", label: "Founder / CEO", focus: "Player trust — avoids aggressive monetization" },
  { id: "VP Automotive Sales", label: "VP Automotive Sales", focus: "Account ownership for Tier-1 OEMs — coverage, retention, growth" },
  { id: "VP Revenue Management", label: "VP Revenue Management", focus: "Pricing lever authority — yield optimization, rate strategy" },
  { id: "Head of ABM", label: "Head of ABM", focus: "Marketing lead for Automotive segment campaigns — ABM strategy, pipeline" },
];

function _parseBriefJSON(text) {
  if (!text) return null;
  try { const p = JSON.parse(text.trim()); if (typeof p === "object" && !Array.isArray(p)) return p; } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (m) { try { return JSON.parse(m[1].trim()); } catch {} }
  const start = text.indexOf("{");
  if (start >= 0) {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") { depth--; if (depth === 0) { try { return JSON.parse(text.slice(start, i + 1)); } catch { break; } } }
    }
  }
  return null;
}

function AlignmentBriefOverview({ go, briefContext, prevView, onEditBrief }) {
  const toast = useToast();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStakeholder, setLoadingStakeholder] = useState(null);

  useEffect(() => {
    if (!briefContext) return;
    setLoading(true); setError(null); setBrief(null);
    (async () => {
      try {
        const cached = await lookupBrief({ context_type: briefContext.context_type, context_data: briefContext.context_data, stakeholder: "general" });
        if (cached.found) { setBrief(cached.brief_data); setLoading(false); return; }
      } catch { /* fall through to generate */ }
      let buffered = "";
      streamAlignmentBrief({
        context_type: briefContext.context_type,
        context_data: briefContext.context_data,
        stakeholder: "general",
        tone: "confident",
        length: "standard",
        onChunk: (chunk) => { buffered += chunk; },
        onDone: () => {
          const parsed = _parseBriefJSON(buffered);
          if (parsed) {
            setBrief(parsed);
            saveBrief({ context_type: briefContext.context_type, context_data: briefContext.context_data, stakeholder: "general", tone: "confident", length: "standard", brief_data: parsed }).catch(() => {});
          } else setError("Failed to parse brief");
          setLoading(false);
        },
        onError: (e) => { setError(e.message); setLoading(false); },
      });
    })();
  }, [briefContext]);

  const handleStakeholderClick = async (sh) => {
    setLoadingStakeholder(sh.id);
    try {
      const cached = await lookupBrief({ context_type: briefContext.context_type, context_data: briefContext.context_data, stakeholder: sh.id });
      if (cached.found) { setLoadingStakeholder(null); onEditBrief({ stakeholder: sh, brief: cached.brief_data, context: briefContext }); return; }
    } catch { /* fall through */ }
    let buffered = "";
    streamAlignmentBrief({
      context_type: briefContext.context_type,
      context_data: briefContext.context_data,
      stakeholder: sh.id,
      tone: "confident",
      length: "standard",
      onChunk: (chunk) => { buffered += chunk; },
      onDone: () => {
        const parsed = _parseBriefJSON(buffered);
        setLoadingStakeholder(null);
        if (parsed) {
          saveBrief({ context_type: briefContext.context_type, context_data: briefContext.context_data, stakeholder: sh.id, tone: "confident", length: "standard", brief_data: parsed }).catch(() => {});
          onEditBrief({ stakeholder: sh, brief: parsed, context: briefContext });
        } else toast.push({ tone: "error", title: "Parse error", body: "Could not generate brief for " + sh.label });
      },
      onError: (e) => { setLoadingStakeholder(null); toast.push({ tone: "error", title: "Error", body: e.message }); },
    });
  };

  if (loading) return (
    <div>
      <ShellTop onBack={() => go(prevView || "home")} />
      <div style={{ textAlign: "center", padding: 80, color: C.muted }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Generating alignment brief…</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>Analyzing portfolio data and context</div>
      </div>
    </div>
  );

  if (error) return (
    <div>
      <ShellTop onBack={() => go(prevView || "home")} />
      <div style={{ textAlign: "center", padding: 60, color: C.red }}>{error}</div>
    </div>
  );

  if (!brief) return null;

  return (
    <div>
      <ShellTop onBack={() => go(prevView || "home")} />
      <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 30, color: C.ink, letterSpacing: "-.015em", marginBottom: 4 }}>
        CXO & Game Leadership Alignment
      </div>
      <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 28 }}>Prepare the case for a player growth recovery plan.</div>

      {/* Stakeholder Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {BRIEF_STAKEHOLDERS.map(sh => (
          <div key={sh.id} style={{ background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: T.radLg, padding: "18px 20px",
            boxShadow: T.shadow1, cursor: loadingStakeholder ? "wait" : "pointer", transition: `all .2s ${T.ease}`, position: "relative", overflow: "hidden" }}
            onMouseEnter={e => { if (!loadingStakeholder) { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.boxShadow = T.shadow2; e.currentTarget.style.transform = "translateY(-2px)"; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = T.shadow1; e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 15, color: C.ink, marginBottom: 6 }}>{sh.label}</div>
            <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45, marginBottom: 12 }}>Focus: {sh.focus}</div>
            <button onClick={() => handleStakeholderClick(sh)} disabled={!!loadingStakeholder}
              style={{ background: "none", border: "none", cursor: loadingStakeholder ? "wait" : "pointer", fontFamily: FONT,
                fontSize: 11.5, fontWeight: 600, color: C.brand, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
              {loadingStakeholder === sh.id ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Generating…</> : "Open editable brief →"}
            </button>
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      {brief.kpis && brief.kpis.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(brief.kpis.length, 3)}, 1fr)`, gap: 14, marginBottom: 22 }}>
          {brief.kpis.map((k, i) => (
            <div key={i} style={{ background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: T.radLg, padding: "18px 20px", boxShadow: T.shadow1 }}>
              <div style={{ fontSize: 9.5, letterSpacing: ".22em", color: C.muted, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>{k.label}</div>
              <div style={{ fontFamily: DISP, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: "-.02em", lineHeight: 1.05 }}>{k.value}</div>
              {k.detail && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{k.detail}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Board Readiness */}
      {brief.board_readiness && (
        <div style={{ background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: T.radLg, padding: "18px 22px", marginBottom: 22, boxShadow: T.shadow1 }}>
          <div style={{ fontSize: 9.5, letterSpacing: ".22em", color: C.muted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Board Readiness</div>
          <div style={{ fontFamily: DISP, fontSize: 24, fontWeight: 600, color: C.ink }}>{brief.board_readiness}</div>
          {brief.board_readiness_reason && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{brief.board_readiness_reason}</div>}
        </div>
      )}

      {/* Board-Ready Narrative */}
      <div style={{ background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: T.radLg, padding: "24px 28px", marginBottom: 22, boxShadow: T.shadow1 }}>
        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 16, letterSpacing: ".04em", textTransform: "uppercase" }}>Board-Ready Narrative</div>
        {brief.executive_summary && (
          <>
            <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 15, color: C.ink, marginBottom: 6 }}>Executive Summary</div>
            <div style={{ fontSize: 13.5, color: C.ink2, lineHeight: 1.7, marginBottom: 20 }}>{brief.executive_summary}</div>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {brief.what_changed?.length > 0 && (
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <FileEdit size={14} color={C.muted} />
                <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 13, color: C.ink }}>What Changed</span>
              </div>
              {brief.what_changed.map((b, i) => <div key={i} style={{ fontSize: 12, color: C.ink2, lineHeight: 1.55, marginBottom: 4 }}>• {b}</div>)}
            </div>
          )}
          {brief.recommended_direction && (
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Zap size={14} color={C.muted} />
                <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 13, color: C.ink }}>Recommended Action</span>
              </div>
              {(Array.isArray(brief.recommended_direction) ? brief.recommended_direction : [brief.recommended_direction]).map((b, i) =>
                <div key={i} style={{ fontSize: 12, color: C.ink2, lineHeight: 1.55, marginBottom: 4 }}>• {b}</div>
              )}
            </div>
          )}
          {brief.counterarguments?.length > 0 && (
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Shield size={14} color={C.muted} />
                <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 13, color: C.ink }}>Predicted Pushback</span>
              </div>
              {brief.counterarguments.map((b, i) => <div key={i} style={{ fontSize: 12, color: C.ink2, lineHeight: 1.55, marginBottom: 4 }}>• {b}</div>)}
            </div>
          )}
          {brief.proof_points?.length > 0 && (
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Check size={14} color={C.muted} />
                <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 13, color: C.ink }}>Counter-Arguments</span>
              </div>
              {brief.proof_points.map((b, i) => <div key={i} style={{ fontSize: 12, color: C.ink2, lineHeight: 1.55, marginBottom: 4 }}>• {b}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlignmentBriefEditor({ go, briefData, onBack }) {
  const toast = useToast();
  const [stakeholder, setStakeholder] = useState(briefData?.stakeholder || BRIEF_STAKEHOLDERS[0]);
  const [tone, setTone] = useState("confident");
  const [length, setLength] = useState("standard");
  const [brief, setBrief] = useState(briefData?.brief || {});
  const [regenerating, setRegenerating] = useState(false);

  const [proofPoints, setProofPoints] = useState(brief.proof_points || []);
  const [counterargs, setCounterargs] = useState(brief.counterarguments || []);
  const [newProof, setNewProof] = useState("");
  const [newCounter, setNewCounter] = useState("");
  useEffect(() => {
    if (briefData?.brief) {
      setBrief(briefData.brief);
      setProofPoints(briefData.brief.proof_points || []);
      setCounterargs(briefData.brief.counterarguments || []);
    }
    if (briefData?.stakeholder) setStakeholder(briefData.stakeholder);
  }, [briefData]);

  const regenerate = async (newStakeholder, newTone, newLength) => {
    const sh = newStakeholder || stakeholder.id;
    const t = newTone || tone;
    const l = newLength || length;
    const ctx = briefData.context;
    setRegenerating(true);
    try {
      const cached = await lookupBrief({ context_type: ctx.context_type, context_data: ctx.context_data, stakeholder: sh });
      if (cached.found && cached.tone === t && cached.length === l) {
        setBrief(cached.brief_data); setProofPoints(cached.brief_data.proof_points || []); setCounterargs(cached.brief_data.counterarguments || []);
        setRegenerating(false); return;
      }
    } catch { /* fall through */ }
    let buffered = "";
    streamAlignmentBrief({
      context_type: ctx.context_type,
      context_data: ctx.context_data,
      stakeholder: sh,
      tone: t,
      length: l,
      onChunk: (chunk) => { buffered += chunk; },
      onDone: () => {
        const parsed = _parseBriefJSON(buffered);
        setRegenerating(false);
        if (parsed) {
          setBrief(parsed); setProofPoints(parsed.proof_points || []); setCounterargs(parsed.counterarguments || []);
          saveBrief({ context_type: ctx.context_type, context_data: ctx.context_data, stakeholder: sh, tone: t, length: l, brief_data: parsed }).catch(() => {});
        } else toast.push({ tone: "error", title: "Parse error", body: "Could not regenerate brief" });
      },
      onError: (e) => { setRegenerating(false); toast.push({ tone: "error", title: "Error", body: e.message }); },
    });
  };

  const handleStakeholderChange = (sh) => { setStakeholder(sh); regenerate(sh.id, tone, length); };
  const handleToneChange = (t) => { setTone(t); regenerate(stakeholder.id, t, length); };
  const handleLengthChange = (l) => { setLength(l); regenerate(stakeholder.id, tone, l); };

  const handleExportPDF = () => {
    downloadReport({
      title: `Alignment Brief — ${stakeholder.label}`,
      subtitle: `${tone.charAt(0).toUpperCase() + tone.slice(1)} tone · ${length} length`,
      timestamp: new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
      contentSections: [
        { heading: "Executive Summary", body: brief.executive_summary || "" },
        { heading: "What Changed", body: (brief.what_changed || []).map(b => `• ${b}`).join("\n") },
        { heading: "Why It Matters", body: (brief.why_it_matters || []).map(b => `• ${b}`).join("\n") },
        { heading: "Recommended Direction", body: brief.recommended_direction || "" },
        { heading: "Investment Required", body: brief.investment_required || "" },
        { heading: "Expected Impact", body: brief.expected_impact || "" },
        { heading: "Key Risks", body: (brief.key_risks || []).map(b => `• ${b}`).join("\n") },
        { heading: "Supporting Evidence", body: proofPoints.map(b => `• ${b}`).join("\n") },
        { heading: "Counterarguments", body: counterargs.map(b => `• ${b}`).join("\n") },
        { heading: "Decision Needed", body: brief.decision_needed || "" },
      ],
      kpis: (brief.kpis || []).map(k => ({ label: k.label, val: k.value, sub: k.detail || "" })),
    });
    toast.push({ tone: "success", title: "PDF exported", body: `Alignment Brief — ${stakeholder.label} downloaded.` });
  };

  const TONES = ["confident", "diplomatic", "direct", "cautious"];
  const LENGTHS = ["tight", "standard", "detailed"];

  return (
    <div>
      <ShellTop onBack={onBack} />
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".2em", color: C.goldDk, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
            Editable Executive Brief · Living Artifact
          </div>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 26, color: C.ink, letterSpacing: "-.015em" }}>
            Alignment Brief — {stakeholder.label}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Refine the message before it leaves the system. Every section is editable.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Btn kind="ghost" small onClick={handleExportPDF}><Download size={13} /> Export PDF</Btn>
          <Btn kind="ghost" small onClick={() => toast.push({ tone: "info", title: "Email", body: "Email integration coming soon." })}><Mail size={13} /> Email</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.muted, fontFamily: FONT }}>← Back to overview</button>
      </div>

      {regenerating && (
        <div style={{ background: `${C.gold}12`, border: `1px solid ${C.gold}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: C.goldDk }} />
          <span style={{ fontSize: 12, color: C.goldDk, fontWeight: 500 }}>Regenerating brief for {stakeholder.label}…</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24 }}>
        {/* Left Sidebar */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Rewrite For</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
            {BRIEF_STAKEHOLDERS.map(sh => (
              <button key={sh.id} onClick={() => handleStakeholderChange(sh)} disabled={regenerating}
                style={{ background: stakeholder.id === sh.id ? C.brand : T.cardElevated, color: stakeholder.id === sh.id ? "#fff" : C.ink,
                  border: `1px solid ${stakeholder.id === sh.id ? C.brand : C.line}`, borderRadius: 8, padding: "8px 12px",
                  fontSize: 12, fontWeight: 500, textAlign: "left", cursor: regenerating ? "wait" : "pointer", fontFamily: FONT }}>
                {sh.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Emphasis</div>
          <div style={{ fontSize: 11, color: C.ink2, marginBottom: 4, padding: "6px 10px", background: C.paper, borderRadius: 6, border: `1px solid ${C.line}` }}>
            {stakeholder.focus?.split("—")[0]?.trim() || "Balanced"}
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 20, lineHeight: 1.4 }}>Shapes which proof points and counter-arguments lead.</div>

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Tone</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
            {TONES.map(t => (
              <button key={t} onClick={() => handleToneChange(t)} disabled={regenerating}
                style={{ background: tone === t ? C.red : T.cardElevated, color: tone === t ? "#fff" : C.ink,
                  border: `1px solid ${tone === t ? C.red : C.line}`, borderRadius: 6, padding: "6px 10px",
                  fontSize: 11, fontWeight: 500, textAlign: "left", cursor: regenerating ? "wait" : "pointer", fontFamily: FONT,
                  textTransform: "capitalize" }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Length</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
            {LENGTHS.map(l => (
              <button key={l} onClick={() => handleLengthChange(l)} disabled={regenerating}
                style={{ background: length === l ? C.red : T.cardElevated, color: length === l ? "#fff" : C.ink,
                  border: `1px solid ${length === l ? C.red : C.line}`, borderRadius: 6, padding: "6px 10px",
                  fontSize: 11, fontWeight: 500, textAlign: "left", cursor: regenerating ? "wait" : "pointer", fontFamily: FONT,
                  textTransform: "capitalize" }}>
                {l}
              </button>
            ))}
          </div>

          {brief.counterarguments?.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Likely Pushback</div>
              {brief.counterarguments.slice(0, 3).map((c, i) => (
                <div key={i} style={{ fontSize: 10.5, color: C.ink2, marginBottom: 6, lineHeight: 1.5 }}>· {c}</div>
              ))}
            </>
          )}
        </div>

        {/* Main Content */}
        <div style={{ position: "relative" }}>
          {regenerating && <div style={{ position: "absolute", inset: 0, zIndex: 10, background: `${T.cardElevated}88`, backdropFilter: "blur(3px)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: T.cardElevated, borderRadius: 8, border: `1px solid ${C.gold}44`, boxShadow: T.shadow2 }}>
              <Loader2 size={16} color={C.goldDk} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Regenerating brief…</span>
            </div>
          </div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: ".18em", color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>
              Full Brief Preview — Review Before Sharing
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>Tailored for {stakeholder.label}</div>
          </div>

          {/* Executive Summary */}
          <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Executive Summary</div>
          <textarea className="brief-textarea" value={brief.executive_summary || ""} onChange={e => setBrief({ ...brief, executive_summary: e.target.value })}
            style={{ width: "100%", minHeight: 80, padding: "12px 14px", fontSize: 13, fontFamily: FONT, color: C.ink, lineHeight: 1.65,
              background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: 8, resize: "vertical", outline: "none" }} />

          {/* 2-col grid: What Changed + Why It Matters */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>What Changed</div>
              <textarea className="brief-textarea" value={(brief.what_changed || []).join("\n· ")} onChange={e => setBrief({ ...brief, what_changed: e.target.value.split("\n· ").map(s => s.replace(/^· /, "")) })}
                style={{ width: "100%", minHeight: 100, padding: "12px 14px", fontSize: 12, fontFamily: FONT, color: C.ink, lineHeight: 1.55,
                  background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: 8, resize: "vertical", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Why It Matters</div>
              <textarea className="brief-textarea" value={(brief.why_it_matters || []).join("\n· ")} onChange={e => setBrief({ ...brief, why_it_matters: e.target.value.split("\n· ").map(s => s.replace(/^· /, "")) })}
                style={{ width: "100%", minHeight: 100, padding: "12px 14px", fontSize: 12, fontFamily: FONT, color: C.ink, lineHeight: 1.55,
                  background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: 8, resize: "vertical", outline: "none" }} />
            </div>
          </div>

          {/* 2-col: Recommended Direction + Investment Required */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Recommended Direction</div>
              <textarea className="brief-textarea" value={brief.recommended_direction || ""} onChange={e => setBrief({ ...brief, recommended_direction: e.target.value })}
                style={{ width: "100%", minHeight: 80, padding: "12px 14px", fontSize: 12, fontFamily: FONT, color: C.ink, lineHeight: 1.55,
                  background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: 8, resize: "vertical", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Investment Required</div>
              <textarea className="brief-textarea" value={brief.investment_required || ""} onChange={e => setBrief({ ...brief, investment_required: e.target.value })}
                style={{ width: "100%", minHeight: 80, padding: "12px 14px", fontSize: 12, fontFamily: FONT, color: C.ink, lineHeight: 1.55,
                  background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: 8, resize: "vertical", outline: "none" }} />
            </div>
          </div>

          {/* 2-col: Expected Impact + Key Risks */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Expected Impact</div>
              <textarea className="brief-textarea" value={brief.expected_impact || ""} onChange={e => setBrief({ ...brief, expected_impact: e.target.value })}
                style={{ width: "100%", minHeight: 80, padding: "12px 14px", fontSize: 12, fontFamily: FONT, color: C.ink, lineHeight: 1.55,
                  background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: 8, resize: "vertical", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Key Risks</div>
              <textarea className="brief-textarea" value={(brief.key_risks || []).join("\n· ")} onChange={e => setBrief({ ...brief, key_risks: e.target.value.split("\n· ").map(s => s.replace(/^· /, "")) })}
                style={{ width: "100%", minHeight: 80, padding: "12px 14px", fontSize: 12, fontFamily: FONT, color: C.ink, lineHeight: 1.55,
                  background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: 8, resize: "vertical", outline: "none" }} />
            </div>
          </div>

          {/* Proof Points */}
          <div style={{ background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: 10, padding: "18px 20px", marginTop: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Supporting Evidence — Proof Points</div>
            {proofPoints.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Check size={14} color={C.green} />
                <input value={p} onChange={e => { const n = [...proofPoints]; n[i] = e.target.value; setProofPoints(n); }}
                  style={{ flex: 1, padding: "8px 10px", fontSize: 12, fontFamily: FONT, color: C.ink, background: C.paper,
                    border: `1px solid ${C.line}`, borderRadius: 6, outline: "none" }} />
                <button onClick={() => setProofPoints(proofPoints.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2 }}><X size={14} /></button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input placeholder="Add a proof point..." value={newProof} onChange={e => setNewProof(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newProof.trim()) { setProofPoints([...proofPoints, newProof.trim()]); setNewProof(""); } }}
                style={{ flex: 1, padding: "8px 10px", fontSize: 12, fontFamily: FONT, color: C.ink, background: C.paper,
                  border: `1px solid ${C.line}`, borderRadius: 6, outline: "none" }} />
              <Btn kind="gold" small onClick={() => { if (newProof.trim()) { setProofPoints([...proofPoints, newProof.trim()]); setNewProof(""); } }}>Add</Btn>
            </div>
          </div>

          {/* Counterarguments */}
          <div style={{ background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: 10, padding: "18px 20px", marginTop: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Counterarguments</div>
            {counterargs.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <RotateCcw size={14} color={C.muted} />
                <input value={c} onChange={e => { const n = [...counterargs]; n[i] = e.target.value; setCounterargs(n); }}
                  style={{ flex: 1, padding: "8px 10px", fontSize: 12, fontFamily: FONT, color: C.ink, background: C.paper,
                    border: `1px solid ${C.line}`, borderRadius: 6, outline: "none" }} />
                <button onClick={() => setCounterargs(counterargs.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2 }}><X size={14} /></button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input placeholder="Add a counterargument..." value={newCounter} onChange={e => setNewCounter(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newCounter.trim()) { setCounterargs([...counterargs, newCounter.trim()]); setNewCounter(""); } }}
                style={{ flex: 1, padding: "8px 10px", fontSize: 12, fontFamily: FONT, color: C.ink, background: C.paper,
                  border: `1px solid ${C.line}`, borderRadius: 6, outline: "none" }} />
              <Btn kind="gold" small onClick={() => { if (newCounter.trim()) { setCounterargs([...counterargs, newCounter.trim()]); setNewCounter(""); } }}>Add</Btn>
            </div>
          </div>

          {/* Decision Needed */}
          <div style={{ background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: 10, padding: "18px 20px", marginTop: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: ".16em", color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Decision Needed</div>
            <textarea className="brief-textarea" value={brief.decision_needed || ""} onChange={e => setBrief({ ...brief, decision_needed: e.target.value })}
              style={{ width: "100%", minHeight: 60, padding: "10px 12px", fontSize: 12.5, fontFamily: FONT, color: C.ink, lineHeight: 1.55,
                background: C.paper, border: `1px solid ${C.line}`, borderRadius: 6, resize: "vertical", outline: "none" }} />
          </div>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 20, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>
              Tuned for <strong>{stakeholder.label}</strong> · {tone.charAt(0).toUpperCase() + tone.slice(1)} tone · {length.charAt(0).toUpperCase() + length.slice(1)} length · {proofPoints.length} proof points · {counterargs.length} counterarguments
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn kind="ghost" small onClick={async () => {
                try {
                  const fullBrief = { ...brief, proof_points: proofPoints, counterarguments: counterargs };
                  await saveBrief({ context_type: briefData.context.context_type, context_data: briefData.context.context_data, stakeholder: stakeholder.id, tone, length, brief_data: fullBrief });
                  toast.push({ tone: "success", title: "Draft saved", body: "Brief saved." });
                } catch { toast.push({ tone: "error", title: "Save failed", body: "Could not save draft." }); }
              }}>Save draft</Btn>
              <Btn kind="gold" small onClick={() => {
                toast.push({ tone: "success", title: "Shared", body: `Shared with ${stakeholder.label}.` });
              }}><Send size={13} /> Share</Btn>
              <Btn kind="gold" onClick={handleExportPDF}>
                <Download size={13} /> Export PDF
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}

/* ------------------------------------------------------------------ HISTORY */
function MemoryView({ go }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [memLoading, setMemLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [timeWindow, setTimeWindow] = useState("all"); // 7d | 30d | 90d | all
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const searchRef = React.useRef(null);

  useEffect(() => { fetchMemoryItems().then(d => { setItems(d); setMemLoading(false); }).catch(() => setMemLoading(false)); }, []);
  useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus(); }, [searchOpen]);

  // Close popovers when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (!e.target.closest("[data-memory-toolbar]")) {
        if (!query) setSearchOpen(false);
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [query]);

  // Filter pipeline — search across title/body/tags/owners, then time-window
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoffMs = { "7d": 7, "30d": 30, "90d": 90 }[timeWindow];
    const now = Date.now();
    return items.filter(it => {
      if (q) {
        const hay = [
          it.title, it.body, it.owners || "",
          ...(it.tags || []).map(t => Array.isArray(t) ? t[0] : t)
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cutoffMs && it.created_at) {
        const age = (now - new Date(it.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (age > cutoffMs) return false;
      }
      return true;
    });
  }, [items, query, timeWindow]);

  const current = filtered.filter(i => i.status === "current").sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const past = filtered.filter(i => i.status === "resolved");

  // Premium card — consistent header (status dot + title + copy), clamped body, footer aligned to bottom
  const Card = ({ c }) => {
    const tone = c.status === "current" ? "green" : "neutral";
    const accent = tone === "green" ? C.green : C.muted;
    return (
      <div style={{
        background: T.cardElevated, border: `1px solid ${C.line}`, borderRadius: T.radLg,
        padding: "20px 22px", marginBottom: 16, boxShadow: T.shadow1,
        cursor: "pointer", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", height: 220,
        transition: `transform .25s ${T.ease}, box-shadow .25s ${T.ease}, border-color .25s ${T.ease}`,
      }}
        onClick={() => go("memory-detail", c)}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = T.shadow3;
          e.currentTarget.style.borderColor = C.line2 || C.line;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = T.shadow1;
          e.currentTarget.style.borderColor = C.line;
        }}>
        {/* Top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.7 }} />

        {/* Header — status dot + title + copy action */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: 999, background: accent, marginTop: 7, flexShrink: 0, boxShadow: `0 0 0 3px ${accent}20` }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 15, color: C.ink, letterSpacing: "-.01em", lineHeight: 1.3, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{c.title}</div>
          </div>
          <button onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(c.title + "\n\n" + c.body).catch(() => {}); }}
            style={{ fontSize: 10.5, color: C.faint, display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: FONT, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, padding: "2px 0" }}>
            <Copy size={11} />
          </button>
          <button onClick={async e => {
            e.stopPropagation();
            try {
              await deleteMemoryItem(c.id);
              setItems(prev => prev.filter(it => it.id !== c.id));
              toast.push({ tone: "success", title: "Discarded", body: `"${c.title}" removed from Memory.` });
            } catch (err) {
              toast.push({ tone: "error", title: "Delete failed", body: err.message });
            }
          }}
            style={{ fontSize: 10.5, color: C.faint, display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: FONT, padding: "2px 0", opacity: 0.6, transition: "opacity .2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}>
            <Trash2 size={11} />
          </button>
        </div>

        {/* Body — fixed line clamp for visual consistency */}
        <div style={{
          fontSize: 12.5, color: C.ink2, lineHeight: 1.55, fontWeight: 400, flex: 1, minHeight: 0,
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden",
        }}>{c.body}</div>

        {/* Footer — timestamp + tags left, owner right, always aligned */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: "auto", paddingTop: 10, borderTop: `1px solid ${C.line}`, flexWrap: "wrap" }}>
          {c.created_at && (() => {
            const d = new Date(c.created_at + (c.created_at.includes("Z") || c.created_at.includes("+") ? "" : "Z"));
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const itemStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const diff = Math.max(0, Math.round((todayStart - itemStart) / 86400000));
            const label = diff === 0 ? "Today" : diff === 1 ? "1d ago" : diff < 30 ? `${diff}d ago` : fmtDateTime(c.created_at, { month: "short", day: "numeric" });
            return (
              <span style={{ fontSize: 10, color: C.faint, fontWeight: 600, letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} /> {label}
              </span>
            );
          })()}
          {(c.tags || []).slice(0, 2).map(([t, tn], i) => (
            <span key={`${t}-${i}`} style={{
              fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: T.radPill, letterSpacing: ".04em", textTransform: "uppercase",
              color: tn === "amber" ? C.amber : tn === "green" ? C.green : C.ink2,
              background: tn === "amber" ? C.amberBg : tn === "green" ? C.greenBg : `${C.faint}18`,
              border: `1px solid ${tn === "amber" ? `${C.amber}33` : tn === "green" ? `${C.green}33` : C.line2}`,
            }}>{t}</span>
          ))}
          {c.owners && (
            <span style={{ marginLeft: "auto", fontSize: 10.5, color: C.faint, fontWeight: 600, letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 5 }}>
              <Users size={11} /> {c.owners}
            </span>
          )}
        </div>
      </div>
    );
  };

  const TIME_WINDOWS = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
    { key: "all", label: "All time" },
  ];

  return (
    <div>
      <ShellTop />
      <CenterTitle />
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ width: 20, height: 1, background: T.goldFoil }} />
          <span style={{ fontSize: 9.5, letterSpacing: ".24em", color: C.goldDk, fontWeight: 700, textTransform: "uppercase" }}>Memory · Decision Ledger</span>
        </div>
        <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 32, color: C.ink, letterSpacing: "-.02em", lineHeight: 1.05, marginBottom: 8 }}>
          What's in motion and What we've learnt.
        </div>
        <div style={{ fontSize: 14, color: C.muted, maxWidth: 640, lineHeight: 1.6 }}>
          Past and in-motion commercial decisions, simulations, and actions across the portfolio.
        </div>
      </div>

      {/* Minimalist toolbar — icon-only by default, expands on click */}
      <div data-memory-toolbar style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        gap: 10, marginBottom: 18, position: "relative",
      }}>
        {/* Result count — fades to muted when active filters set */}
        <span style={{
          fontSize: 11, color: C.muted, letterSpacing: ".08em", fontWeight: 600,
          textTransform: "uppercase", marginRight: "auto", opacity: 0.75,
        }}>
          {filtered.length} {filtered.length === 1 ? "decision" : "decisions"}
          {(query || timeWindow !== "all") && <span style={{ color: C.goldDk, marginLeft: 8, fontWeight: 700 }}>· filtered</span>}
        </span>

        {/* Search — animated width on click */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.card, border: `1px solid ${query || searchOpen ? C.gold : C.line}`,
          borderRadius: T.radPill, padding: "0 6px 0 12px", height: 36,
          width: searchOpen ? 320 : 36, overflow: "hidden",
          transition: `width .35s cubic-bezier(.4,0,.2,1), border-color .2s ${T.ease}, box-shadow .2s ${T.ease}`,
          boxShadow: searchOpen ? `0 0 0 4px ${C.gold}12` : "none", cursor: searchOpen ? "text" : "pointer",
        }}
          onClick={() => !searchOpen && setSearchOpen(true)}>
          <Search size={14} color={query || searchOpen ? C.goldDk : C.muted} style={{ flexShrink: 0 }} />
          {searchOpen && (
            <>
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") { setQuery(""); setSearchOpen(false); } }}
                placeholder="Search decisions, owners, tags…"
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  fontFamily: FONT, fontSize: 13, color: C.ink, fontWeight: 500, minWidth: 0,
                }}
              />
              <button onClick={e => { e.stopPropagation(); setQuery(""); setSearchOpen(false); }}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 6,
                  color: C.muted, display: "flex", alignItems: "center", borderRadius: 999,
                }}><X size={13} /></button>
            </>
          )}
        </div>

        {/* Filter — icon button + dropdown popover */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setFilterOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: C.card, border: `1px solid ${timeWindow !== "all" || filterOpen ? C.gold : C.line}`,
              borderRadius: T.radPill, height: 36, padding: timeWindow !== "all" ? "0 14px 0 12px" : "0 10px",
              cursor: "pointer", fontFamily: FONT, transition: `all .2s ${T.ease}`,
              boxShadow: filterOpen ? `0 0 0 4px ${C.gold}12` : "none",
            }}>
            <Clock size={14} color={timeWindow !== "all" || filterOpen ? C.goldDk : C.muted} />
            {timeWindow !== "all" && (
              <span style={{ fontSize: 11.5, fontWeight: 700, color: C.ink, letterSpacing: ".02em" }}>
                {TIME_WINDOWS.find(w => w.key === timeWindow)?.label}
              </span>
            )}
          </button>

          {filterOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 20,
              background: C.card, border: `1px solid ${C.line}`, borderRadius: T.radLg,
              boxShadow: T.shadow3, padding: 6, minWidth: 180,
              animation: "fadeIn .2s ease-out",
            }}>
              <div style={{ fontSize: 9.5, letterSpacing: ".2em", color: C.muted, fontWeight: 700, textTransform: "uppercase", padding: "8px 12px 6px" }}>
                Time window
              </div>
              {TIME_WINDOWS.map(w => (
                <button key={w.key} onClick={() => { setTimeWindow(w.key); setFilterOpen(false); }}
                  onMouseEnter={e => e.currentTarget.style.background = `${C.gold}10`}
                  onMouseLeave={e => e.currentTarget.style.background = timeWindow === w.key ? `${C.gold}14` : "transparent"}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                    padding: "9px 12px", borderRadius: 8, border: "none",
                    background: timeWindow === w.key ? `${C.gold}14` : "transparent",
                    fontSize: 12.5, fontWeight: timeWindow === w.key ? 700 : 500,
                    color: timeWindow === w.key ? C.ink : C.ink2, cursor: "pointer",
                    fontFamily: FONT, transition: `background .15s ${T.ease}`,
                  }}>
                  <span>{w.label}</span>
                  {timeWindow === w.key && <Check size={13} color={C.goldDk} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {memLoading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: C.card, border: `1px dashed ${C.line2 || C.line}`, borderRadius: T.radLg }}>
          <Loader2 size={28} color={C.gold} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 16, color: C.muted }}>Loading decisions…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: C.card, border: `1px dashed ${C.line2 || C.line}`, borderRadius: T.radLg }}>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 18, color: C.ink, marginBottom: 6 }}>No decisions match</div>
          <div style={{ fontSize: 13, color: C.muted }}>Try a different search term or expand the time window.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 22, color: C.ink, letterSpacing: "-.01em", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: C.green, boxShadow: `0 0 0 3px ${C.green}25` }} />
                In Motion
              </div>
              <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 18, color: C.ink2 }}>{current.length}</span>
            </div>
            {current.length === 0 && <div style={{ fontSize: 12, color: C.muted, padding: "12px 0", fontStyle: "italic" }}>No in-motion items in this window.</div>}
            {current.map((c) => <Card key={c.id} c={c} />)}
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 22, color: C.ink, letterSpacing: "-.01em", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: C.muted, opacity: 0.5 }} />
                Resolved
              </div>
              <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 18, color: C.ink2 }}>{past.length}</span>
            </div>
            {past.length === 0 && <div style={{ fontSize: 12, color: C.muted, padding: "12px 0", fontStyle: "italic" }}>No resolved items in this window.</div>}
            {past.map((c) => <Card key={c.id} c={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryDetailView({ go, item }) {
  if (!item) return <div style={{ padding:40, textAlign:"center", color:C.muted }}>No item selected</div>;

  const tree = item.decision_tree || [];
  const logs = item.activity_log || [];
  const learns = item.learnings || [];
  const edges = tree.filter(n => n.parent).length;

  const ALL_COLS = ["ID", "DATE", "STEP", "CHANGE", "CONTEXT", "DELTA", "NOTES"];
  const [visibleCols, setVisibleCols] = React.useState(ALL_COLS);
  const [showColMenu, setShowColMenu] = React.useState(false);

  const toggleCol = (col) => {
    setVisibleCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const exportCSV = () => {
    if (!logs.length) return;
    const colKeys = { ID: "id", STEP: "step", CHANGE: "change", CONTEXT: "context", DELTA: "delta", NOTES: "notes" };
    const header = visibleCols.join(",");
    const rows = logs.map(log => visibleCols.map(col => {
      const val = String(log[colKeys[col]] || "").replace(/"/g, '""');
      return `"${val}"`;
    }).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${(item.title || "export").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deltaColor = (d) => {
    const dl = (d || "").toLowerCase();
    if (dl === "high") return { fg:C.red, bg:C.redBg };
    if (dl === "action") return { fg:C.amber, bg:C.amberBg };
    return { fg:C.green, bg:C.greenBg };
  };

  const nodeColor = (type) => {
    if (type === "signal") return C.goldDk;
    if (type === "decision") return C.brandLt;
    if (type === "outcome") return C.green;
    if (type === "data_internal") return "#2CA58D";
    if (type === "data_external") return "#0EA5E9";
    if (type === "analysis") return C.amber;
    return C.green;
  };

  return (
    <div>
      <ShellTop />
      <CenterTitle />

      {/* Back button */}
      <button onClick={() => go("memory")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
        cursor:"pointer", fontFamily:FONT, fontSize:13, color:C.muted, fontWeight:600, marginBottom:20, padding:0 }}>
        <ArrowLeft size={14} /> Back to Memory
      </button>

      {/* Header + Metadata */}
      <div style={{ display:"flex", gap:24, marginBottom:16, alignItems:"flex-start" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:DISP, fontWeight:600, fontSize:28, color:C.ink, letterSpacing:"-.02em", lineHeight:1.1, marginBottom:12 }}>
            {item.title}
          </div>
          <div style={{ fontSize:14, color:C.ink2, lineHeight:1.7, marginBottom:12 }}>
            {item.body}
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {(item.tags || []).map(([t, tone]) => (
              <span key={t} style={{ fontSize:10.5, fontWeight:700, padding:"5px 12px", borderRadius:T.radPill, letterSpacing:".03em", textTransform:"uppercase",
                color: tone === "amber" ? C.amber : tone === "green" ? C.green : C.ink2,
                background: tone === "amber" ? C.amberBg : tone === "green" ? C.greenBg : `${C.faint}18`,
                border:`1px solid ${tone === "amber" ? `${C.amber}33` : tone === "green" ? `${C.green}33` : C.line2}` }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ minWidth:280, background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"14px 18px", flexShrink:0,
          display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 20px" }}>
          {[
            ["Status", item.status === "current" ? "In Motion" : "Resolved"],
            ["Region", item.region],
            ["Coverage", item.coverage],
            ["Owner", item.owners],
          ].map(([label, val]) => val && (
            <div key={label}>
              <div style={{ fontSize:9.5, letterSpacing:".1em", color:C.faint, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:13, color:C.ink, fontWeight:500 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Learnings — only shown for resolved/past items */}
      {item.status !== "current" && learns.length > 0 && (() => {
        const cats = [
          { key:"worked", label:"WHAT WORKED", icon:"✓", color:C.green },
          { key:"didnt_work", label:"WHAT DIDN'T WORK", icon:"✗", color:C.red },
          { key:"next_time", label:"FOR NEXT TIME", icon:"★", color:C.goldDk },
        ];
        return (
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ width:20, height:1, background:T.goldFoil }} />
              <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Learnings</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              {cats.map(cat => {
                const entry = learns.find(l => l.category === cat.key);
                return (
                  <div key={cat.key} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"20px 22px", minHeight:140, boxShadow:T.shadow1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                      <span style={{ fontSize:14, color:cat.color }}>{cat.icon}</span>
                      <span style={{ fontSize:10.5, fontWeight:700, letterSpacing:".12em", color:cat.color }}>{cat.label}</span>
                    </div>
                    <div style={{ fontSize:13, color:C.ink2, lineHeight:1.7 }}>
                      {entry ? entry.body : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Decision Tree */}
      {tree.length > 0 && (
        <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"24px 28px", marginBottom:28, boxShadow:T.shadow1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:C.ink, display:"grid", placeItems:"center" }}>
              <GitBranch size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:C.ink }}>{item.title}</div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
            {[{color:"#2CA58D",label:"Done"},{color:"#0EA5E9",label:"Active"},{color:"#9CA3AF",label:"Pending"}].map(l => (
              <div key={l.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:999, background:l.color }} />
                <span style={{ fontSize:10.5, fontWeight:600, color:C.muted, letterSpacing:".04em" }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Decision tree — React Flow */}
          {(() => {
            const sorted = [...tree].sort((a,b) => a.order - b.order);
            if (!sorted.length || !sorted.find(n => !n.parent)) return null;

            const NODE_W = 210, NODE_BASE_H = 80;
            const estimateH = (n) => {
              const labelLen = (n.label || "").length;
              const subLen = (n.sub || "").length;
              return NODE_BASE_H + Math.floor(subLen / 35) * 16 + (labelLen > 30 ? 16 : 0);
            };

            const childrenOf = (key) => sorted.filter(n => n.parent === key);
            const edges = [];
            const rewired = new Set();
            sorted.forEach(p => {
              const kids = childrenOf(p.key);
              if (kids.length < 2) return;
              const sources = kids.filter(k => /^data_/.test(k.type));
              const merge = kids.find(k => k.type === "analysis" || k.type === "correlates");
              if (sources.length >= 2 && merge) {
                sources.forEach(s => { edges.push({ from: p.key, to: s.key }); edges.push({ from: s.key, to: merge.key }); rewired.add(s.key); rewired.add(merge.key); });
              }
            });
            sorted.filter(n => n.parent && !rewired.has(n.key)).forEach(n => edges.push({ from: n.parent, to: n.key }));

            const g = new dagre.graphlib.Graph();
            g.setGraph({ rankdir: "LR", nodesep: 24, ranksep: 70, marginx: 20, marginy: 20 });
            g.setDefaultEdgeLabel(() => ({}));
            sorted.forEach(n => g.setNode(n.key, { width: NODE_W, height: estimateH(n) }));
            edges.forEach(e => g.setEdge(e.from, e.to));
            dagre.layout(g);

            const rfNodes = sorted.map(n => {
              const pos = g.node(n.key);
              return { id: n.key, type: "treeCard", position: { x: pos.x - NODE_W / 2, y: pos.y - pos.height / 2 },
                data: { label: n.label, sub: n.sub, color: n.color || C.green, status: n.status, ink: C.ink, muted: C.muted },
                style: { width: NODE_W } };
            });
            const rfEdges = edges.map(e => ({
              id: `${e.from}-${e.to}`, source: e.from, target: e.to, type: "smoothstep",
              style: { stroke: C.line, strokeWidth: 2 },
              animated: sorted.find(n => n.key === e.to)?.status === "active" || sorted.find(n => n.key === e.to)?.status === "pending",
            }));

            const bounds = rfNodes.reduce((b, n) => {
              const pos = g.node(n.id);
              return { maxX: Math.max(b.maxX, pos.x + NODE_W / 2), maxY: Math.max(b.maxY, pos.y + pos.height / 2) };
            }, { maxX: 0, maxY: 0 });
            const containerH = Math.min(500, Math.max(320, bounds.maxY + 60));

            return (
              <div style={{ height: containerH, width: "100%", borderRadius: 10, overflow: "hidden" }}>
                <ReactFlow
                  nodes={rfNodes}
                  edges={rfEdges}
                  nodeTypes={treeNodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.15 }}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  panOnDrag={true}
                  zoomOnScroll={false}
                  zoomOnPinch={true}
                  minZoom={0.3}
                  maxZoom={1.5}
                  proOptions={{ hideAttribution: true }}
                >
                  <Controls showInteractive={false} position="bottom-right"
                    style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }} />
                </ReactFlow>
              </div>
            );
          })()}

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, paddingTop:12, borderTop:`1px solid ${C.line}` }}>
            <div style={{ fontSize:11, color:C.muted }}>
              {tree.length} nodes · {edges} edges
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {logs.length > 0 && (
        <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"24px 28px", marginBottom:28, boxShadow:T.shadow1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontFamily:DISP, fontWeight:600, fontSize:18, color:C.ink }}>Activity Log</span>
              <span style={{ fontSize:11, color:C.faint }}>·</span>
              <span style={{ fontSize:11, color:C.muted }}>Memory Activity · {logs.length} events</span>
            </div>
            <div style={{ display:"flex", gap:10, position:"relative" }}>
              <span onClick={exportCSV} style={{ fontSize:11, color:C.muted, border:`1px solid ${C.line}`, borderRadius:T.radPill, padding:"5px 12px", fontWeight:600, cursor:"pointer", transition:"all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.gold}12`; e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.ink; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.muted; }}>Export</span>
              <span onClick={() => setShowColMenu(v => !v)} style={{ fontSize:11, color: showColMenu ? C.ink : C.muted, border:`1px solid ${showColMenu ? C.gold : C.line}`, borderRadius:T.radPill, padding:"5px 12px", fontWeight:600, cursor:"pointer", background: showColMenu ? `${C.gold}12` : "transparent", transition:"all .15s" }}
                onMouseEnter={e => { if(!showColMenu) { e.currentTarget.style.background = `${C.gold}12`; e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.ink; }}}
                onMouseLeave={e => { if(!showColMenu) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.muted; }}}>Columns</span>
              {showColMenu && (
                <div style={{ position:"absolute", top:"100%", right:0, marginTop:6, background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:"8px 0", boxShadow:T.shadow2, zIndex:20, minWidth:140 }}>
                  {ALL_COLS.map(col => (
                    <div key={col} onClick={() => toggleCol(col)} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", cursor:"pointer", fontSize:12, color: visibleCols.includes(col) ? C.ink : C.muted, fontWeight:500, transition:"background .1s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${C.gold}08`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${visibleCols.includes(col) ? C.gold : C.line2}`, background: visibleCols.includes(col) ? C.gold : "transparent", display:"grid", placeItems:"center", flexShrink:0 }}>
                        {visibleCols.includes(col) && <span style={{ color:"#fff", fontSize:10, fontWeight:800, lineHeight:1 }}>✓</span>}
                      </span>
                      {col}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${C.line}` }}>
                {visibleCols.map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"10px 12px", fontSize:10.5, letterSpacing:".1em", color:C.faint, fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const dc = deltaColor(log.delta);
                return (
                  <tr key={log.id} style={{ borderBottom:`1px solid ${C.line}`, transition:"background .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${C.gold}08`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    {visibleCols.includes("ID") && <td style={{ padding:"12px", color:C.muted, fontWeight:600, fontSize:12 }}>{log.id}</td>}
                    {visibleCols.includes("DATE") && <td style={{ padding:"12px", color:C.muted, fontSize:12, whiteSpace:"nowrap" }}>{log.date || "—"}</td>}
                    {visibleCols.includes("STEP") && <td style={{ padding:"12px", color:C.ink, fontWeight:500 }}>{log.step}</td>}
                    {visibleCols.includes("CHANGE") && <td style={{ padding:"12px", color:C.ink2, fontWeight:500 }}>{log.change}</td>}
                    {visibleCols.includes("CONTEXT") && <td style={{ padding:"12px", color:C.muted }}>{log.context === "AI Analysis" ? "Companion Analysis" : log.context}</td>}
                    {visibleCols.includes("DELTA") && <td style={{ padding:"12px" }}>
                      <span style={{ fontSize:10.5, fontWeight:700, padding:"3px 10px", borderRadius:T.radPill,
                        color:dc.fg, background:dc.bg }}>{log.delta}</span>
                    </td>}
                    {visibleCols.includes("NOTES") && <td style={{ padding:"12px", color:C.ink2, fontSize:12, maxWidth:280 }}>{log.notes}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

/* ------------------------------------------------------------------ DEEP SIMULATION */
const LEVER_CATEGORIES = [
  { key: "marketing", label: "Marketing" },
  { key: "sales", label: "Sales" },
  { key: "service", label: "Service" },
  { key: "pricing", label: "Pricing" },
  { key: "policy", label: "Policy" },
  { key: "portfolio", label: "Portfolio" },
  { key: "product_strategy", label: "Product" },
  { key: "pricing_strategy", label: "Pricing Strat." },
  { key: "deal_mgmt", label: "Deal Mgmt" },
  { key: "investment", label: "Investment" },
  { key: "network", label: "Network" },
  { key: "partnership", label: "Partnership" },
];

const LEVER_GROUP_TABS = [
  { key: "all", label: "All Levers" },
  { key: "automotive", label: "Automotive" },
  { key: "enterprise", label: "Enterprise" },
  { key: "shared", label: "Shared" },
];

function StepperHeader({ step, setStep, maxStep, activeLeversCount }) {
  const STEPS = [
    { num: 1, label: "Strategy", icon: Shield },
    { num: 2, label: "Levers", icon: Activity },
    { num: 3, label: "Budget & Review", icon: Settings },
    { num: 4, label: "Results", icon: BarChart3 },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 32,
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 28px",
      boxShadow: "0 2px 8px rgba(40,22,12,.06)" }}>
      {STEPS.map((s, i) => {
        const done = step > s.num;
        const active = step === s.num;
        const clickable = s.num <= maxStep;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.num}>
            {i > 0 && (
              <div style={{ width: 48, height: 2, background: done ? C.green : active ? C.gold : C.line,
                margin: "0 4px", borderRadius: 2, transition: "background 0.3s" }} />
            )}
            <button onClick={() => clickable && setStep(s.num)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 16px", borderRadius: 10,
                border: active ? `2px solid ${C.gold}` : done ? `2px solid ${C.green}44` : `2px solid transparent`,
                background: active ? C.amberBg : done ? C.greenBg : "transparent",
                cursor: clickable ? "pointer" : "default", fontFamily: FONT, transition: "all 0.25s",
                opacity: !clickable ? 0.45 : 1 }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                background: done ? C.green : active ? C.gold : C.line,
                display: "grid", placeItems: "center", transition: "background 0.3s" }}>
                {done ? <Check size={16} color="#fff" strokeWidth={3} />
                  : <Icon size={15} color={active ? C.brand : C.faint} />}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 10, letterSpacing: ".08em", color: done ? C.green : active ? C.goldDk : C.faint,
                  fontWeight: 700 }}>STEP {s.num}</div>
                <div style={{ fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? C.ink : done ? C.ink2 : C.muted, whiteSpace: "nowrap" }}>
                  {s.label}
                  {s.num === 2 && activeLeversCount > 0 && (
                    <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 7px", borderRadius: 999,
                      background: C.gold, color: C.brand, fontWeight: 800 }}>{activeLeversCount}</span>
                  )}
                </div>
              </div>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepNavButtons({ step, setStep, maxStep, onRun, running, canRun }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
      <div>
        {step > 1 && step < 4 && (
          <Btn kind="ghost" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={15} /> Back
          </Btn>
        )}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {step < 3 && (
          <Btn kind="gold" onClick={() => setStep(step + 1)}>
            Continue <ArrowRight size={15} />
          </Btn>
        )}
        {step === 3 && (
          <Btn kind="gold" onClick={onRun}>
            {running ? "Running..." : "Run Simulation"} <Play size={14} />
          </Btn>
        )}
      </div>
    </div>
  );
}

function DeepSimulationView() {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [levers, setLevers] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [leverValues, setLeverValues] = useState({});
  const [budget, setBudget] = useState(7.2);
  const [timeHorizon, setTimeHorizon] = useState("Q");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeGroup, setActiveGroup] = useState("all");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedScenarioName, setSelectedScenarioName] = useState(null);
  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const goStep = (s) => {
    setStep(s);
    setMaxStep((prev) => Math.max(prev, s));
  };

  React.useEffect(() => {
    fetchLevers().then((data) => {
      setLevers(data);
      const defaults = {};
      data.forEach((l) => { defaults[l.lever_id] = l.default_val; });
      setLeverValues(defaults);
    }).catch(console.error);
    fetchScenarios().then(setScenarios).catch(console.error);
  }, []);

  React.useEffect(() => {
    if (!running) return;
    const t0 = Date.now();
    const interval = setInterval(() => setElapsed(((Date.now() - t0) / 1000).toFixed(1)), 100);
    return () => clearInterval(interval);
  }, [running]);

  const filteredLevers = useMemo(() => {
    return levers.filter((l) => {
      if (activeGroup !== "all" && l.lever_group !== activeGroup) return false;
      if (activeCategory !== "all" && l.category !== activeCategory) return false;
      return true;
    });
  }, [levers, activeGroup, activeCategory]);

  const activeLevers = useMemo(() => {
    return levers.filter((l) => leverValues[l.lever_id] !== l.default_val);
  }, [levers, leverValues]);

  const categories = useMemo(() => {
    const cats = new Set(filteredLevers.map((l) => l.category));
    return LEVER_CATEGORIES.filter((c) => cats.has(c.key));
  }, [filteredLevers]);

  const handleLeverChange = (leverId, value) => {
    setLeverValues((prev) => ({ ...prev, [leverId]: parseFloat(value) }));
  };

  const handleLoadScenario = async (sc) => {
    setSelectedScenario(sc.id);
    setSelectedScenarioName(sc.name);
    if (sc.levers_config) {
      const newVals = { ...leverValues };
      levers.forEach((l) => { newVals[l.lever_id] = l.default_val; });
      sc.levers_config.forEach((ls) => { newVals[ls.lever_id] = ls.value; });
      setLeverValues(newVals);
      if (sc.budget) setBudget(sc.budget);
    }
    goStep(2);
  };

  const handleRun = async () => {
    setRunning(true);
    setElapsed(0);
    try {
      const activeLeverSettings = levers
        .filter((l) => leverValues[l.lever_id] !== l.default_val)
        .map((l) => ({ lever_id: l.lever_id, value: leverValues[l.lever_id] }));

      if (activeLeverSettings.length === 0) {
        alert("Adjust at least one lever from its default value to run a simulation.");
        setRunning(false);
        return;
      }

      const payload = {
        levers: activeLeverSettings,
        budget,
        time_horizon: timeHorizon,
        scenario_id: selectedScenario,
        pinned_signals: [],
        scenario_iterations: 1000,
        cxo_id: 1,
      };
      const res = await runDeepSimulation(payload);
      setResult(res);
      goStep(4);
    } catch (e) {
      console.error(e);
      alert("Simulation failed. Check backend connection.");
    }
    setRunning(false);
  };

  const handleSave = async () => {
    if (!saveName) return;
    try {
      const activeLeverSettings = levers
        .filter((l) => leverValues[l.lever_id] !== l.default_val)
        .map((l) => ({ lever_id: l.lever_id, value: leverValues[l.lever_id] }));
      await saveScenario({
        name: saveName,
        description: `Custom scenario with ${activeLeverSettings.length} levers`,
        levers_config: activeLeverSettings,
        budget,
        time_horizon: timeHorizon,
        gap_closure_pct: result?.gap_closure_pct || null,
      });
      setShowSave(false);
      setSaveName("");
      fetchScenarios().then(setScenarios);
    } catch (e) {
      console.error(e);
    }
  };

  const resetAll = () => {
    const defaults = {};
    levers.forEach((l) => { defaults[l.lever_id] = l.default_val; });
    setLeverValues(defaults);
    setSelectedScenario(null);
    setSelectedScenarioName(null);
    setResult(null);
    goStep(1);
    setMaxStep(1);
  };

  /* ---- STEP 1: Strategy Setup ---- */
  const renderStep1 = () => (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 24, color: C.ink, marginBottom: 6 }}>
          Choose Your Strategy
        </div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
          Start from a preset scenario or begin with a blank slate.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {scenarios.map((sc) => {
          const on = selectedScenario === sc.id;
          return (
            <button key={sc.id} onClick={() => handleLoadScenario(sc)}
              style={{ textAlign: "left", background: on ? C.greenBg : "#fff",
                border: `1.5px solid ${on ? C.green : C.line}`, borderRadius: 14,
                padding: "20px 20px", cursor: "pointer", fontFamily: FONT,
                transition: "all 0.2s", boxShadow: on ? `0 2px 12px ${C.green}18` : "0 1px 4px rgba(40,22,12,.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}>
                  {sc.name}
                  {sc.is_preset && (
                    <span style={{ fontSize: 9, background: C.amberBg, color: C.amber, padding: "2px 7px",
                      borderRadius: 4, fontWeight: 700 }}>PRESET</span>
                  )}
                </span>
                {sc.gap_closure_pct != null && (
                  <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 20, color: on ? C.green : C.ink2 }}>
                    {sc.gap_closure_pct}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{sc.description}</div>
              <div style={{ marginTop: 12, fontSize: 12, color: C.brandLt, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 5 }}>
                Select & Configure <ArrowRight size={13} />
              </div>
            </button>
          );
        })}

        {/* Start Fresh Card */}
        <button onClick={() => { setSelectedScenario(null); setSelectedScenarioName("Custom Hybrid"); goStep(2); }}
          style={{ textAlign: "left", background: C.paper,
            border: `1.5px dashed ${C.line2}`, borderRadius: 14,
            padding: "20px 20px", cursor: "pointer", fontFamily: FONT, transition: "all 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.gold}22`,
              display: "grid", placeItems: "center" }}>
              <Sparkles size={18} color={C.goldDk} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Start Fresh</span>
          </div>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
            Begin with all levers at baseline. Build your own scenario from scratch.
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: C.brandLt, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 5 }}>
            Configure Levers <ArrowRight size={13} />
          </div>
        </button>
      </div>

      <StepNavButtons step={1} setStep={goStep} maxStep={maxStep} />
    </div>
  );

  /* ---- STEP 2: Lever Workbench ---- */
  const renderStep2 = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 22, color: C.ink }}>Configure Levers</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Pull levers to model impact on revenue, margin, win rate, and volume.
            {selectedScenarioName && (
              <span style={{ marginLeft: 8, fontSize: 11, padding: "3px 10px", borderRadius: 999,
                background: C.greenBg, color: C.green, fontWeight: 600, border: `1px solid ${C.green}33` }}>
                {selectedScenarioName}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {activeLevers.length > 0 && (
            <span style={{ fontSize: 12, padding: "6px 14px", borderRadius: 999,
              background: C.gold, color: C.brand, fontWeight: 700 }}>
              {activeLevers.length} lever{activeLevers.length !== 1 ? "s" : ""} active
            </span>
          )}
          <Btn kind="ghost" small onClick={() => {
            const defaults = {};
            levers.forEach((l) => { defaults[l.lever_id] = l.default_val; });
            setLeverValues(defaults);
          }}>
            <RotateCcw size={13} /> Reset All
          </Btn>
        </div>
      </div>

      {/* Group Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {LEVER_GROUP_TABS.map((g) => (
          <button key={g.key} onClick={() => { setActiveGroup(g.key); setActiveCategory("all"); }}
            style={{ padding: "7px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              background: activeGroup === g.key ? C.brand : "#fff",
              color: activeGroup === g.key ? "#fff" : C.ink2,
              border: `1px solid ${activeGroup === g.key ? C.brand : C.line2}`, fontFamily: FONT,
              transition: "all 0.2s" }}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: 5, marginBottom: 18, flexWrap: "wrap" }}>
        <button onClick={() => setActiveCategory("all")}
          style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            background: activeCategory === "all" ? C.gold : "#fff",
            color: activeCategory === "all" ? C.brand : C.ink2,
            border: `1px solid ${activeCategory === "all" ? C.gold : C.line2}`, fontFamily: FONT }}>
          All
        </button>
        {categories.map((cat) => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
            style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              background: activeCategory === cat.key ? C.gold : "#fff",
              color: activeCategory === cat.key ? C.brand : C.ink2,
              border: `1px solid ${activeCategory === cat.key ? C.gold : C.line2}`, fontFamily: FONT }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lever Cards — 2 column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {filteredLevers.map((l) => {
          const val = leverValues[l.lever_id] ?? l.default_val;
          const isModified = val !== l.default_val;
          return (
            <div key={l.lever_id} style={{ background: isModified ? C.amberBg : "#fff",
              border: `1.5px solid ${isModified ? C.gold : C.line}`, borderRadius: 12, padding: "14px 16px",
              transition: "border-color 0.2s, background 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5, color: C.ink }}>{l.name}</span>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{l.description}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                  <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 18, color: isModified ? C.goldDk : C.ink2 }}>
                    {val}{l.unit}
                  </span>
                  {isModified && (
                    <div style={{ fontSize: 10, color: C.faint }}>default: {l.default_val}{l.unit}</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: C.faint, width: 36, textAlign: "right" }}>{l.min_val}</span>
                <input type="range" min={l.min_val} max={l.max_val} step={l.step} value={val}
                  onChange={(e) => handleLeverChange(l.lever_id, e.target.value)}
                  style={{ flex: 1, accentColor: isModified ? C.gold : C.brandLt }} />
                <span style={{ fontSize: 10, color: C.faint, width: 36 }}>{l.max_val}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                <span style={{ fontSize: 10, color: C.faint }}>
                  {l.lever_group === "automotive" ? "Auto" : l.lever_group === "enterprise" ? "Enterprise" : "Shared"}
                  {" · "}{l.category}
                </span>
                {isModified && (
                  <button onClick={() => handleLeverChange(l.lever_id, l.default_val)}
                    style={{ fontSize: 10, color: C.brandLt, background: "none", border: "none",
                      cursor: "pointer", fontFamily: FONT, fontWeight: 600 }}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filteredLevers.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: 30, textAlign: "center", color: C.muted, fontSize: 13 }}>
            No levers match the current filter.
          </div>
        )}
      </div>

      <StepNavButtons step={2} setStep={goStep} maxStep={maxStep} />
    </div>
  );

  /* ---- STEP 3: Budget & Review ---- */
  const renderStep3 = () => (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 24, color: C.ink, marginBottom: 6 }}>
          Budget & Review
        </div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
          Set your budget, time horizon, and review your configuration before running.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Budget & Time */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ink, marginBottom: 16 }}>
            BUDGET & TIME HORIZON
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 10 }}>
            <span style={{ color: C.ink2, fontWeight: 500 }}>Quarterly Budget</span>
            <span style={{ fontWeight: 600, color: C.ink, fontFamily: DISP, fontSize: 20 }}>${budget.toFixed(1)}M</span>
          </div>
          <input type="range" min={2} max={25} step={0.5} value={budget}
            onChange={(e) => setBudget(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: C.gold, marginBottom: 4 }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.faint, marginBottom: 20 }}>
            <span>$2M</span><span>$25M</span>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ink, marginBottom: 10 }}>
            TIME HORIZON
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["Q", "This Quarter"], ["FY26", "Full Year 26"], ["FY27", "Full Year 27"]].map(([h, label]) => (
              <button key={h} onClick={() => setTimeHorizon(h)}
                style={{ flex: 1, padding: "12px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: timeHorizon === h ? C.brand : "#fff", color: timeHorizon === h ? "#fff" : C.ink2,
                  border: `1.5px solid ${timeHorizon === h ? C.brand : C.line2}`, cursor: "pointer",
                  fontFamily: FONT, transition: "all 0.2s" }}>
                <div>{h}</div>
                <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2,
                  color: timeHorizon === h ? "#ffffff99" : C.faint }}>{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Summary */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ink, marginBottom: 16 }}>
            CONFIGURATION SUMMARY
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.ink2 }}>Strategy</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
              {selectedScenarioName || "Custom Hybrid"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.ink2 }}>Active Levers</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: activeLevers.length > 0 ? C.goldDk : C.faint,
              fontFamily: DISP }}>{activeLevers.length}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.ink2 }}>Scenario Iterations</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>1,000</span>
          </div>

          {activeLevers.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: ".04em", marginBottom: 8 }}>
                KEY CHANGES
              </div>
              <div style={{ maxHeight: 160, overflowY: "auto" }}>
                {activeLevers.slice(0, 8).map((l) => (
                  <div key={l.lever_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "5px 0", fontSize: 12 }}>
                    <span style={{ color: C.ink2 }}>{l.name}</span>
                    <span style={{ fontWeight: 600, color: C.goldDk, fontFamily: DISP }}>
                      {leverValues[l.lever_id]}{l.unit}
                    </span>
                  </div>
                ))}
                {activeLevers.length > 8 && (
                  <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>
                    +{activeLevers.length - 8} more
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => goStep(1)} style={{ fontSize: 11, color: C.brandLt, background: "none",
              border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={12} /> Change Strategy
            </button>
            <button onClick={() => goStep(2)} style={{ fontSize: 11, color: C.brandLt, background: "none",
              border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={12} /> Edit Levers
            </button>
          </div>
        </div>
      </div>

      {/* Running Overlay */}
      {running && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14,
          padding: "48px 24px", textAlign: "center", marginTop: 24,
          boxShadow: "0 4px 20px rgba(40,22,12,.08)" }}>
          <Activity size={32} color={C.gold} style={{ animation: "spin 1.5s linear infinite", marginBottom: 16 }} />
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 18, color: C.ink, marginBottom: 8 }}>
            Running scenario analysis
          </div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 18 }}>
            1,000 iterations with {activeLevers.length} active levers at ${budget.toFixed(1)}M budget
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {["Initialize", "Simulate", "Analyze", "Synthesize"].map((s, i) => (
              <span key={s} style={{ fontSize: 11.5, padding: "5px 14px", borderRadius: 8, fontWeight: 600,
                background: parseFloat(elapsed) > i * 1.2 ? C.gold : C.line,
                color: parseFloat(elapsed) > i * 1.2 ? C.brand : C.faint,
                transition: "all 0.3s" }}>
                {s}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: C.goldDk, fontWeight: 600, fontFamily: DISP, marginTop: 14 }}>
            {elapsed}s
          </div>
        </div>
      )}

      {!running && (
        <StepNavButtons step={3} setStep={goStep} maxStep={maxStep} onRun={handleRun}
          running={running} canRun={activeLevers.length > 0} />
      )}
    </div>
  );

  /* ---- STEP 4: Results ---- */
  const renderStep4 = () => {
    if (!result) return null;
    return (
      <div style={{ animation: "fadeIn 0.5s ease-out" }}>
        {/* Top Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 24, color: C.ink }}>
              Simulation Results
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              {result.scenario_name} · ${budget.toFixed(1)}M · {timeHorizon} · {activeLevers.length} levers
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="ghost" small onClick={() => goStep(2)}>
              <RotateCcw size={13} /> Reconfigure
            </Btn>
            <Btn kind="ghost" small onClick={() => setShowSave(!showSave)}>
              <Save size={13} /> Save
            </Btn>
            <Btn kind="primary" small onClick={resetAll}>
              New Simulation
            </Btn>
          </div>
        </div>

        {/* Save Dialog */}
        {showSave && (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10,
            padding: 14, marginBottom: 18, display: "flex", gap: 10, alignItems: "center" }}>
            <input value={saveName} onChange={(e) => setSaveName(e.target.value)}
              placeholder="Name this scenario..."
              style={{ flex: 1, border: `1px solid ${C.line2}`, borderRadius: 8, padding: "9px 14px",
                fontSize: 13.5, fontFamily: FONT, outline: "none" }} />
            <Btn kind="gold" small onClick={handleSave}>Save Scenario</Btn>
            <Btn kind="ghost" small onClick={() => setShowSave(false)}>Cancel</Btn>
          </div>
        )}

        {/* Compare Paths */}
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ink, marginBottom: 12 }}>
          COMPARE PATHS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
          {[result.comparison.do_nothing, result.comparison.recommended, result.comparison.hybrid].map((p) => {
            const isHybrid = p.label === "YOUR HYBRID";
            const isRec = p.label === "RECOMMENDED";
            return (
              <div key={p.label} style={{ background: C.card, borderRadius: 14, padding: "20px 16px", textAlign: "center",
                border: `2px solid ${isRec ? C.green : isHybrid ? C.gold : C.line}`,
                boxShadow: isRec ? `0 2px 12px ${C.green}18` : "none" }}>
                <div style={{ fontSize: 10.5, letterSpacing: ".08em", color: C.muted, fontWeight: 700, marginBottom: 8 }}>
                  {p.label}
                </div>
                <div style={{ fontFamily: DISP, fontSize: 36, fontWeight: 600,
                  color: isRec ? C.green : isHybrid ? C.goldDk : C.ink2 }}>
                  {p.gap_closure}%
                </div>
                <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>gap closed</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12,
                  fontSize: 11, color: C.muted }}>
                  <span>Rev: ${p.revenue}M</span>
                  <span>Margin: {p.margin}pp</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Verdict */}
        <div style={{ background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 14,
          padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", color: C.green, fontWeight: 700, marginBottom: 8 }}>
            COMPANION RECOMMENDATION
          </div>
          <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.6, fontWeight: 500 }}>{result.verdict}</div>
        </div>

        {/* Metric Bands */}
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ink, marginBottom: 12 }}>
          PROJECTED IMPACT <span style={{ color: C.faint, fontWeight: 500 }}>P10 / P50 / P90 confidence bands</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[result.revenue_impact, result.margin_impact, result.win_rate_impact, result.volume_impact].map((band) => (
            <div key={band.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
              padding: "16px 18px" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".04em", color: C.muted, fontWeight: 600, marginBottom: 8 }}>
                {band.label}
              </div>
              <div style={{ fontFamily: DISP, fontSize: 26, fontWeight: 600,
                color: band.p50 >= 0 ? C.green : C.red }}>
                {band.p50 >= 0 ? "+" : ""}{band.p50}{band.unit}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: C.faint }}>
                <span>P10: {band.p10}{band.unit}</span>
                <span>P90: {band.p90}{band.unit}</span>
              </div>
              <div style={{ height: 5, background: C.line, borderRadius: 3, marginTop: 8, position: "relative" }}>
                <div style={{ position: "absolute", left: "0%", width: "100%", height: "100%",
                  background: `linear-gradient(90deg, ${C.amber}66, ${band.p50 >= 0 ? C.green : C.red}88, ${C.amber}66)`,
                  borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Sensitivity side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {/* Revenue Trajectory */}
          {result.chart_data && result.chart_data.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "20px 20px 8px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: C.ink, marginBottom: 14 }}>
                REVENUE TRAJECTORY
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={result.chart_data} barGap={4} margin={{ top: 10, right: 6, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.faint }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="baseline" name="Baseline" fill={C.brandLt} radius={[3, 3, 0, 0]} maxBarSize={32} opacity={0.5} />
                  <Bar dataKey="projected" name="Projected (P50)" fill={C.gold} radius={[3, 3, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sensitivity Tornado */}
          {result.sensitivity && result.sensitivity.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "20px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: C.ink, marginBottom: 14 }}>
                SENSITIVITY ANALYSIS <span style={{ color: C.faint, fontWeight: 500 }}>revenue by lever (+-20%)</span>
              </div>
              {result.sensitivity.slice(0, 8).map((s) => {
                const range = Math.abs(s.high_impact - s.low_impact);
                const maxRange = Math.abs(result.sensitivity[0].high_impact - result.sensitivity[0].low_impact) || 1;
                const widthPct = Math.max(8, (range / maxRange) * 100);
                return (
                  <div key={s.lever_id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ width: 120, fontSize: 11, color: C.ink2, fontWeight: 500, textAlign: "right", flexShrink: 0 }}>
                      {s.lever_name.length > 18 ? s.lever_name.slice(0, 18) + "..." : s.lever_name}
                    </span>
                    <div style={{ flex: 1, height: 18, background: C.line, borderRadius: 4, position: "relative" }}>
                      <div style={{ position: "absolute", left: `${50 - widthPct / 2}%`, width: `${widthPct}%`,
                        height: "100%", background: `linear-gradient(90deg, ${C.red}88, ${C.gold}, ${C.green}88)`,
                        borderRadius: 4 }} />
                    </div>
                    <span style={{ width: 70, fontSize: 10.5, color: C.faint, textAlign: "right", flexShrink: 0 }}>
                      ${s.low_impact} — ${s.high_impact}M
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Interaction Warnings + Lever Contribution side by side */}
        <div style={{ display: "grid",
          gridTemplateColumns: (result.interaction_warnings?.length > 0 && result.lever_results?.length > 0) ? "1fr 1fr" : "1fr",
          gap: 20, marginBottom: 24 }}>

          {/* Interaction Warnings */}
          {result.interaction_warnings && result.interaction_warnings.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ink, marginBottom: 10 }}>
                INTERACTION EFFECTS
              </div>
              {result.interaction_warnings.map((w, i) => {
                const col = w.severity === "critical" ? C.red : w.severity === "warning" ? C.amber : C.brandLt;
                const bg = w.severity === "critical" ? C.redBg : w.severity === "warning" ? C.amberBg : C.paper;
                return (
                  <div key={i} style={{ background: bg, border: `1px solid ${col}33`, borderRadius: 10,
                    padding: "12px 16px", marginBottom: 8, fontSize: 13, color: C.ink2, lineHeight: 1.5,
                    display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <AlertTriangle size={15} color={col} style={{ flexShrink: 0, marginTop: 2 }} />
                    {w.message}
                  </div>
                );
              })}
            </div>
          )}

          {/* Lever Contribution */}
          {result.lever_results && result.lever_results.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ink, marginBottom: 10 }}>
                LEVER CONTRIBUTION <span style={{ color: C.faint, fontWeight: 500 }}>ranked by revenue impact</span>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "6px 16px" }}>
                {result.lever_results.slice(0, 10).map((lr, i) => (
                  <div key={lr.lever_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 0", borderBottom: i < Math.min(result.lever_results.length, 10) - 1 ? `1px solid ${C.line}` : "none",
                    fontSize: 13 }}>
                    <span style={{ color: C.ink, fontWeight: 500 }}>{lr.name}</span>
                    <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <span style={{ color: lr.revenue_delta >= 0 ? C.green : C.red, fontWeight: 600, fontFamily: DISP }}>
                        {lr.revenue_delta >= 0 ? "+" : ""}{lr.revenue_delta}$M
                      </span>
                      <span style={{ color: C.faint, fontSize: 11, width: 36, textAlign: "right" }}>{lr.contribution_pct}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DataFootnote />
      </div>
    );
  };

  return (
    <div>
      <StepperHeader step={step} setStep={goStep} maxStep={maxStep} activeLeversCount={activeLevers.length} />
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  );
}

/* ------------------------------------------------------------------ ABM DATA (from prototype) */
const ABM_BAD_ACCOUNTS = [
  { id:"FORD", name:"Ford Motor Company", tier:"T1", subv:"OEM", abm:"1-to-1", planRev:148, actualRev:118, gap:-30, gapPct:-20.3, headroom:92, sow:21, quartersDeclining:3,
    rootCause:"Ford's first-quarter US production was disrupted by the BlueOval City Tennessee start-up timing slip (now Aug 2026, originally Jun) — softening Detroit-Memphis inbound volume by an estimated 14% in our network. Compounded by FedEx Federal Express segment's 10% Q3 FY26 US domestic revenue growth (Mar 19 8-K) capturing share at lighter weight bands where Ford's aftermarket parts dominate. UPS dedicated account team coverage at Ford was reduced from 2.5 FTE to 1.0 FTE in the Jan 2026 reorganization that accompanied the broader $3B cost-out program — coverage gap visible in 38% YoY decline in executive-level touchpoints.",
    signals:[{type:"Plant",title:"Ford BlueOval City TN production start delayed to Aug 2026 (per Ford 8-K)",weight:"high"},{type:"Competitor",title:"FedEx Q3 FY26: US domestic revenue +10%, package volume growing",weight:"high"},{type:"Coverage",title:"Ford account team coverage reduced 2.5 → 1.0 FTE in Jan 2026 reorg",weight:"high"},{type:"Fuel",title:"Middle East conflict drove fuel cost spike — Ford inbound corridor exposed",weight:"med"}],
    analog:{name:"General Motors",traits:"Comparable size ($142M actual UPS revenue vs Ford's plan $148M), same Detroit-3 OEM sub-segment, identical JIT inbound logistics dependency, same Tier-1 supplier overlap pattern (Magna, Lear, Aptiv).",behavior:"GM also experienced FedEx encroachment in Q4 2025 but UPS executed a targeted 1-to-1 ABM motion (initiative INI-2025-027, still in-flight) with monthly CCO briefings, dedicated Industry Expert in Detroit, and NAAF capacity lock. Result through Q3 of 4: engagement frequency up 47%, modeled $22M lift trending.",whyResonates:"Same sub-segment, comparable size, identical competitive threat vector. The GM playbook is the most directly transferable — and Ford's procurement reorg makes them more receptive to executive-led engagement right now.",outcomeLift:"+$22M modeled · +4pp win rate · 14% engagement frequency improvement",outcomeQuarters:4},
    marketing:{annualSpend:0.62,mixHighTouchPct:40,channels:[{name:"Executive briefings (1-to-1)",spend:0.14,roi:5.4,status:"under-invested"},{name:"Industry events sponsorship",spend:0.12,roi:4.1,status:"baseline"},{name:"Co-marketing & content",spend:0.08,roi:3.2,status:"baseline"},{name:"Digital ABM (programmatic + LinkedIn)",spend:0.18,roi:1.8,status:"over-invested"},{name:"Field marketing (Detroit)",spend:0.10,roi:2.6,status:"baseline"}],blendedROI:3.0,benchmarkROI:4.8},
    asIs:{abmBudget:0.62,execSponsor:1,accountTeam:1,industryExpert:1,channelMix:40,industryEvents:2,thoughtLeadership:1,coMarketing:0,naafGuarantee:0,bundle:0,pilotOffer:0,peakGuarantee:0},
    recommended:{abmBudget:1.4,execSponsor:3,accountTeam:2,industryExpert:2,channelMix:65,industryEvents:4,thoughtLeadership:2,coMarketing:2,naafGuarantee:2,bundle:2,pilotOffer:0,peakGuarantee:1},
    recommendedLift:{rev:24,winRate:6.2,cycle:-14,marketingDelta:0.78,confidence:"P50 · P10 +$11M / P90 +$38M"},
    playBullets:["Restore Ford account team coverage from 1.0 FTE to 2.0 FTE; deploy 2nd Industry Expert dedicated to Detroit corridor.","Shift channel mix from 40% high-touch to 65% high-touch — reduce digital programmatic spend, lift executive briefings + industry events.","SVP-level executive sponsorship cadence (monthly), modeled after GM 1-to-1 playbook (initiative INI-2025-027 in-flight).","Hard NAAF Mexico capacity lock + multi-service bundle (NAAF + Brokerage + Capital + Premier) + peak-season SLA-backed guarantee."] },
  { id:"STLA", name:"Stellantis North America", tier:"T1", subv:"OEM", abm:"1-to-1", planRev:110, actualRev:86, gap:-24, gapPct:-21.8, headroom:124, sow:16, quartersDeclining:2,
    rootCause:"Stellantis is the second-most exposed Detroit-3 OEM to the 2025 trade policy shifts that rerouted Asia-to-Mexico flows, and FedEx Freight's June 1, 2026 spin-off has refocused FedEx Federal Express on small-parcel competition exactly where Stellantis-Toluca cross-border volume sits. UPS share-of-wallet at Stellantis is structurally low because the procurement reorg in late 2025 moved logistics decision-making into central Procurement — weakening UPS relationships built with the prior commercial team. Carrier-mix review window now open for the Detroit↔Toluca corridor.",
    signals:[{type:"Competitive",title:"FedEx Freight spin-off Jun 1, 2026 — FedEx Express refocuses on small-parcel",weight:"high"},{type:"Trade Policy",title:"2025 trade policy shifts continue rerouting Asia→Americas flows",weight:"high"},{type:"Customer-org",title:"Stellantis procurement reorg late 2025 — logistics moved to central Procurement",weight:"high"}],
    analog:{name:"Magna International",traits:"Both are heavily exposed to USMCA cross-border (Mexico Tier-1/Tier-2 supplier ecosystem). Magna's UPS revenue is ~$76M actual vs Stellantis $86M actual — comparable scale, comparable Mexico-corridor dependency.",behavior:"UPS turned Magna around (initiative INI-2024-031, Aug 2024 – Mar 2025) with industry-event-led ABM (NAFA + Automotive Logistics Summit sponsorship) paired with CCO-level monthly briefings AND a multi-service bundle (NAAF + Brokerage + Capital). Outcome: +$21M actual revenue vs +$18M modeled, SOW lifted from 24% to 31%.",whyResonates:"Same cross-border exposure, comparable size, same procurement-reorganization vulnerability. The Magna playbook is well-rehearsed and transferable — and UPS Capital trade-finance attach (which worked at Magna) is directly applicable to Stellantis-Toluca.",outcomeLift:"+$21M actual · +9pp win rate · SOW 24% → 31%",outcomeQuarters:3},
    marketing:{annualSpend:0.48,mixHighTouchPct:35,channels:[{name:"Executive briefings (1-to-1)",spend:0.10,roi:5.8,status:"under-invested"},{name:"Industry events sponsorship",spend:0.08,roi:6.2,status:"under-invested"},{name:"Co-marketing & content",spend:0.06,roi:3.4,status:"baseline"},{name:"Digital ABM",spend:0.16,roi:1.6,status:"over-invested"},{name:"Trade-finance pursuit (UPS Capital)",spend:0.08,roi:7.2,status:"under-invested"}],blendedROI:2.8,benchmarkROI:4.8},
    asIs:{abmBudget:0.48,execSponsor:1,accountTeam:1,industryExpert:0,channelMix:35,industryEvents:1,thoughtLeadership:1,coMarketing:0,naafGuarantee:0,bundle:0,pilotOffer:0,peakGuarantee:0},
    recommended:{abmBudget:1.6,execSponsor:3,accountTeam:2,industryExpert:2,channelMix:70,industryEvents:4,thoughtLeadership:2,coMarketing:2,naafGuarantee:3,bundle:3,pilotOffer:0,peakGuarantee:0},
    recommendedLift:{rev:28,winRate:8.4,cycle:-18,marketingDelta:1.12,confidence:"P50 · P10 +$14M / P90 +$44M"},
    playBullets:["Re-establish executive relationships at central Procurement (post-reorg) — SVP cadence + monthly CCO briefings.","Industry-event-led ABM (NAFA + Automotive Logistics Summit) modeled after Magna playbook (INI-2024-031, +$21M actual).","Premium NAAF Mexico capacity (exclusive lanes) + multi-service bundle including UPS Capital trade-finance attach for Detroit↔Toluca corridor.","2nd Industry Expert deployed to Monterrey · cross-border customs brokerage included in proposal."] },
  { id:"TSLA", name:"Tesla, Inc.", tier:"T1", subv:"EV", abm:"1-to-1", planRev:42, actualRev:22, gap:-20, gapPct:-47.6, headroom:68, sow:11, quartersDeclining:4,
    rootCause:"Tesla's logistics strategy continues shifting toward in-house and regional 3PLs across all production hubs (Fremont, Austin, Sparks NV). Tesla is not exposed to FedEx in the same way as legacy OEMs — Tesla's competitive logistics threat is a build-versus-buy thesis, not carrier substitution. UPS engagement with Tesla supply chain leadership has been transactional rather than strategic, missing the Austin parts hub rebalance opportunity in late 2025.",
    signals:[{type:"Customer Demand",title:"Tesla Austin parts hub rebalance — preferred-carrier RFP imminent (Q3 timing)",weight:"high"},{type:"Engagement",title:"UPS engagement at Tesla supply chain has been ad-hoc, not strategic",weight:"high"},{type:"Healthcare/cold-chain",title:"UPS cold-chain capabilities (Andlauer + Frigo-Trans) relevant to EV battery thermal sensitivity",weight:"med"}],
    analog:{name:"Rivian Automotive",traits:"Both are EV pure-plays with $14–22M UPS revenue (similar small base). Both have in-house logistics aspirations but limited internal capability. Both run lean procurement teams that buy on solution-fit, not pricing.",behavior:"UPS won preferred-carrier status at Rivian through: Class-9 hazmat capability demonstration for battery shipping, cold-chain-adjacent thought leadership, free 8-week pilot program, and customer advisory board seat offered to Rivian's VP Supply Chain. Result: +$11M actual UPS revenue, preferred-carrier status retained 5 quarters.",whyResonates:"Same EV pure-play DNA, comparable small base, same in-house/3PL competitive vector (not FedEx). The Rivian playbook is the only directly proven pattern UPS has for converting an EV manufacturer at this scale.",outcomeLift:"+$11M actual · preferred-carrier status secured · 5 quarter retention",outcomeQuarters:5},
    marketing:{annualSpend:0.18,mixHighTouchPct:25,channels:[{name:"Executive briefings (1-to-1)",spend:0.03,roi:6.4,status:"under-invested"},{name:"Industry events sponsorship",spend:0.02,roi:5.8,status:"under-invested"},{name:"Thought leadership (cold-chain)",spend:0.04,roi:7.8,status:"under-invested"},{name:"Digital ABM",spend:0.06,roi:1.4,status:"over-invested"},{name:"Capability demo (Class-9 hazmat)",spend:0.03,roi:8.6,status:"under-invested"}],blendedROI:4.4,benchmarkROI:5.6},
    asIs:{abmBudget:0.18,execSponsor:0,accountTeam:0.5,industryExpert:0,channelMix:25,industryEvents:1,thoughtLeadership:1,coMarketing:0,naafGuarantee:0,bundle:0,pilotOffer:0,peakGuarantee:0},
    recommended:{abmBudget:0.95,execSponsor:2,accountTeam:1.5,industryExpert:1,channelMix:60,industryEvents:3,thoughtLeadership:3,coMarketing:2,naafGuarantee:0,bundle:1,pilotOffer:8,peakGuarantee:0},
    recommendedLift:{rev:18,winRate:12.4,cycle:-22,marketingDelta:0.77,confidence:"P50 · P10 +$8M / P90 +$32M (high variance)"},
    playBullets:["Class-9 hazmat capability demonstration for EV battery shipping (Rivian-pattern; we have the credentials).","Cold-chain-adjacent thought leadership (relevant to EV thermal sensitivity) — leverage Andlauer + Frigo-Trans capabilities.","Free 8-week NAAF pilot offer on the Austin corridor + Customer Advisory Board seat for Tesla VP Supply Chain.","VP-level executive sponsorship (Rivian-scale, not CCO) — relationship-and-capability-driven, not pricing-driven."] },
  { id:"HMNA", name:"Honda North America", tier:"T1", subv:"OEM", abm:"1-to-1", planRev:88, actualRev:67, gap:-21, gapPct:-23.9, headroom:74, sow:18, quartersDeclining:2,
    rootCause:"Marysville plant Civic-Accord production schedule shift to Q3 ramp (confirmed via Wards Auto) created a 3-month inbound parts logistics gap that Yusen Logistics — Honda's traditional JIT partner — captured aggressively under an expanded contract. UPS account team coverage at Honda Marysville was reduced from 1.5 FTE to 0.5 FTE in the Jan 2026 reorg, accelerating the relationship erosion. Fuel cost spike from March 2026 Middle East conflict further pressured Honda's already-thin inbound corridor margins.",
    signals:[{type:"Production",title:"Honda Marysville Civic-Accord schedule shift — Q3 ramp confirmed (Wards Auto)",weight:"high"},{type:"Competitor",title:"Yusen Logistics expanded JIT contract with Honda Marysville",weight:"high"},{type:"Coverage",title:"UPS Marysville coverage reduced 1.5 → 0.5 FTE in Jan 2026 reorg",weight:"high"},{type:"Fuel",title:"Middle East conflict March 2026 — diesel cost pressure on inbound corridor",weight:"med"}],
    analog:{name:"Toyota Motor NA",traits:"Both are Japanese transplant OEMs with ~$70–100M UPS revenue range (Toyota actual $104M, Honda actual $67M). Both run JIT-intensive operations from US assembly plants (Toyota Georgetown KY vs Honda Marysville OH).",behavior:"UPS executed a production-cadence-aligned 1-to-1 ABM motion at Toyota (initiative INI-2025-014, completed Sep 2025): dedicated Industry Expert deployed to Georgetown, JIT operational playbook delivered, multi-year contract incentive with growth-triggered rebate. Result: +$14M actual revenue (vs +$16M modeled), +4.4pp win rate.",whyResonates:"Same Japanese transplant DNA, comparable JIT dependency, same plant-cadence-driven inbound logistics shape. Honda has the same conditions for the playbook to work, and the Marysville Q3 ramp creates a natural moment to deploy.",outcomeLift:"+$14M actual · +4.4pp win rate · +$2.90 RPP",outcomeQuarters:4},
    marketing:{annualSpend:0.34,mixHighTouchPct:32,channels:[{name:"Executive briefings (1-to-1)",spend:0.06,roi:5.2,status:"under-invested"},{name:"Industry events sponsorship",spend:0.04,roi:4.4,status:"baseline"},{name:"JIT operational playbook (custom)",spend:0.08,roi:6.8,status:"under-invested"},{name:"Digital ABM",spend:0.10,roi:1.4,status:"over-invested"},{name:"Field marketing (Marysville)",spend:0.06,roi:3.6,status:"baseline"}],blendedROI:3.2,benchmarkROI:4.6},
    asIs:{abmBudget:0.34,execSponsor:1,accountTeam:0.5,industryExpert:0,channelMix:32,industryEvents:1,thoughtLeadership:1,coMarketing:0,naafGuarantee:0,bundle:0,pilotOffer:0,peakGuarantee:0},
    recommended:{abmBudget:1.2,execSponsor:2,accountTeam:2,industryExpert:1,channelMix:62,industryEvents:4,thoughtLeadership:2,coMarketing:1,naafGuarantee:1,bundle:2,pilotOffer:0,peakGuarantee:1},
    recommendedLift:{rev:21,winRate:5.8,cycle:-12,marketingDelta:0.86,confidence:"P50 · P10 +$10M / P90 +$34M"},
    playBullets:["Restore Marysville coverage from 0.5 FTE to 2.0 FTE ahead of Q3 Civic-Accord ramp.","Production-cadence-aligned JIT operational playbook (Toyota analog, INI-2025-014 +$14M actual).","Industry Expert dedicated to Marysville · multi-year contract incentive with growth-triggered rebate.","Soft NAAF capacity guarantee + multi-service bundle + SLA-backed peak-season performance guarantee."] },
  { id:"AZO", name:"AutoZone", tier:"T2", subv:"Aftermarket", abm:"1-to-few", planRev:58, actualRev:41, gap:-17, gapPct:-29.3, headroom:48, sow:17, quartersDeclining:3,
    rootCause:"AutoZone's Q3 2025 earnings call explicit signal of carrier-diversification review created an immediate FedEx counter-offer cycle, and FedEx's 8.5% base discount with 24-month lock pressured UPS pricing posture below the L2 Tier ceiling. UPS treated AutoZone as 1-to-few ABM tier despite the carrier-mix review being a 1-to-1 strategic event — marketing investment misallocated to digital programmatic instead of executive engagement. Approaching aftermarket peak season (Aug-Oct) is the last retention window.",
    signals:[{type:"Customer Demand",title:"AutoZone Q3 2025 earnings: 'reviewing carrier diversification'",weight:"high"},{type:"Competitor",title:"FedEx counter-offer at -8.5% base disc with 24-mo lock",weight:"high"},{type:"ABM-tier",title:"AutoZone treated as 1-to-few ABM tier despite 1-to-1 strategic event",weight:"high"},{type:"Seasonality",title:"Aftermarket peak Aug-Oct — retention window narrowing",weight:"med"}],
    analog:{name:"O'Reilly Automotive",traits:"Direct comparable in T2 aftermarket distribution — O'Reilly actual UPS revenue $36M vs AutoZone $41M, both have identical national distribution footprint, both run reverse-logistics-intensive operations.",behavior:"UPS retained O'Reilly through a 1-to-1 ABM re-tier with: Happy Returns reverse-logistics bundle promotion, executive sponsorship from CCO + VP Aftermarket Sales, peak-season capacity guarantee. Result: +$8M ADV, retention secured, +$1.80 RPP.",whyResonates:"Same T2 aftermarket sub-vertical, comparable size, identical reverse-logistics need (which Happy Returns acquisition uniquely addresses). The O'Reilly playbook is the most directly applicable retention pattern — and the peak-season timing aligns naturally.",outcomeLift:"+$8M ADV · retention secured · +$1.80 RPP",outcomeQuarters:2},
    marketing:{annualSpend:0.22,mixHighTouchPct:30,channels:[{name:"Executive briefings",spend:0.02,roi:5.4,status:"under-invested"},{name:"Happy Returns reverse logistics ABM",spend:0.04,roi:7.2,status:"under-invested"},{name:"Co-marketing & content",spend:0.04,roi:3.8,status:"baseline"},{name:"Digital ABM",spend:0.08,roi:1.6,status:"over-invested"},{name:"Field marketing",spend:0.04,roi:2.4,status:"baseline"}],blendedROI:3.0,benchmarkROI:4.4},
    asIs:{abmBudget:0.22,execSponsor:0,accountTeam:0.5,industryExpert:0,channelMix:30,industryEvents:1,thoughtLeadership:0,coMarketing:0,naafGuarantee:0,bundle:0,pilotOffer:0,peakGuarantee:0},
    recommended:{abmBudget:0.85,execSponsor:3,accountTeam:1.5,industryExpert:1,channelMix:60,industryEvents:2,thoughtLeadership:1,coMarketing:2,naafGuarantee:0,bundle:3,pilotOffer:0,peakGuarantee:1},
    recommendedLift:{rev:14,winRate:9.6,cycle:-8,marketingDelta:0.63,confidence:"P50 · P10 +$7M / P90 +$24M"},
    playBullets:["Re-tier AutoZone from 1-to-few to 1-to-1 ABM — escalate to SVP-level executive sponsorship (Matt + VP Aftermarket Sales).","Happy Returns reverse-logistics bundle promotion (O'Reilly-pattern, +$8M actual; addresses AutoZone's aftermarket peak need).","Peak-season SLA-backed capacity guarantee (Aug–Oct) — direct counter to FedEx 24-month lock offer.","Co-marketing case study + Industry Expert paired with the account · 1 Industry Expert assigned to the aftermarket cohort."] },
];
const ABM_TOP_ACCOUNTS = [
  { id:"MGA", name:"Magna International", tier:"T1", subv:"Tier-1", planRev:68, actualRev:76, gap:8, gapPct:11.8 },
  { id:"TMC", name:"Toyota Motor NA", tier:"T1", subv:"OEM", planRev:98, actualRev:104, gap:6, gapPct:6.1 },
  { id:"GM", name:"General Motors", tier:"T1", subv:"OEM", planRev:138, actualRev:142, gap:4, gapPct:2.9 },
  { id:"APTV", name:"Aptiv PLC", tier:"T1", subv:"Tier-1", planRev:48, actualRev:51, gap:3, gapPct:6.3 },
  { id:"ORLY", name:"O'Reilly Automotive", tier:"T2", subv:"Aftermarket", planRev:34, actualRev:36, gap:2, gapPct:5.9 },
];
const ABM_LEVERS_META = {
  abmBudget:{cat:"Investment & coverage",colorKey:"gold",title:"ABM investment on this account",desc:"Account-dedicated marketing budget across all channels (1-to-1 briefings, events, content, digital). Reallocated from segment-wide ABM pool.",unit:"$M / yr",min:0,max:5,step:0.1,default:0.8,constraint:"Marketing Budget"},
  execSponsor:{cat:"Investment & coverage",colorKey:"gold",title:"Executive sponsorship intensity",desc:"Seniority of UPS executive engaging this account on a quarterly cadence. CCO involvement signals strategic priority.",unit:"",min:0,max:4,step:1,default:1,options:["None","Director","VP","SVP","CCO (Matt)"],constraint:"Executive Calendar"},
  accountTeam:{cat:"Investment & coverage",colorKey:"gold",title:"Dedicated account team capacity",desc:"Account Director + Solution Architect FTE-equivalents dedicated to this account.",unit:" FTE",min:0,max:4,step:0.5,default:1,constraint:"Sales Team Capacity"},
  industryExpert:{cat:"Investment & coverage",colorKey:"gold",title:"Industry expert deployment",desc:"Number of Automotive Industry Experts paired 1-to-1 with this account. Tied to the $50M segment investment hiring plan.",unit:"",min:0,max:3,step:1,default:1,constraint:"Senior Industry Experts"},
  channelMix:{cat:"Channel & marketing mix",colorKey:"green",title:"High-touch vs digital channel mix",desc:"% allocation to high-touch (executive briefings, in-person, events) vs digital (LinkedIn ABM, content syndication, programmatic).",unit:"% high-touch",min:0,max:100,step:5,default:50,constraint:"Channel ROI"},
  industryEvents:{cat:"Channel & marketing mix",colorKey:"green",title:"Industry event presence",desc:"Number of marquee industry events to invest in for this account (NAFA, Automotive Logistics Summit, SEMA, NADA, AIAG).",unit:" events / yr",min:0,max:12,step:1,default:3,constraint:"Marquee Events"},
  thoughtLeadership:{cat:"Channel & marketing mix",colorKey:"green",title:"Thought leadership investment",desc:"Custom industry research, analyst briefings, and intellectual capital production directed at this account's buying committee.",unit:"",min:0,max:3,step:1,default:1,options:["None","Light","Standard","Premium"]},
  coMarketing:{cat:"Channel & marketing mix",colorKey:"green",title:"Co-marketing activation",desc:"Joint case study, customer advisory board seat, customer-conference speaking slot, industry award nomination.",unit:"",min:0,max:3,step:1,default:0,options:["None","Case study","CAB seat + case study","Full activation"]},
  naafGuarantee:{cat:"Promotional plays",colorKey:"violet",title:"NAAF Mexico capacity guarantee",desc:"Lock NAAF Mexico capacity for this account ahead of competitor launches. Costs capacity allocation flexibility.",unit:"",min:0,max:3,step:1,default:0,options:["No guarantee","Soft (priority)","Hard (locked %)","Premium (exclusive)"]},
  bundle:{cat:"Promotional plays",colorKey:"violet",title:"Multi-service bundle promotion",desc:"Bundled offering across Ground + Air + NAAF + Capital + Roadie + Happy Returns.",unit:"",min:0,max:3,step:1,default:0,options:["None","Light (2-svc)","Strong (3-svc)","Premium (4+ svc)"]},
  pilotOffer:{cat:"Promotional plays",colorKey:"violet",title:"Trial / pilot offer",desc:"Free-trial or pilot lane offering. Reduces buyer risk on new accounts; powerful for EV pure-plays and competitor-incumbent flips.",unit:" weeks",min:0,max:12,step:4,default:0},
  peakGuarantee:{cat:"Promotional plays",colorKey:"violet",title:"Peak-season performance guarantee",desc:"SLA-backed performance commitment during peak (Aug-Dec). Reduces account anxiety on volume surges.",unit:"",min:0,max:1,step:1,default:0,options:["Off","On (SLA-backed)"]},
};
const ABM_INITIATIVES = [
  { id:"INI-2024-031",name:"Magna 1-to-1 ABM + NAFA event sponsorship",account:"Magna International",status:"completed",stage:"Outcome measured",owner:"Sreekar Pothula (Sr. Director, Auto Mktg)",createdDate:"Aug 12, 2024",endDate:"Mar 28, 2025",modeledRev:18,actualRev:21,modeledWinRate:8.0,actualWinRate:9.2,notes:"Outperformed. Magna lifted SOW from 24% to 31%. Industry-event-led ABM scored highly.",levers:["Industry events (4)","1-to-1 ABM ($1.2M)","CCO sponsorship","Bundle promotion"],
    whatWorked:"NAFA NACFE event sponsorship + CCO appearance unlocked C-suite engagement that direct 1-to-1 ABM wasn't reaching. Pipeline qualified above modeled by 18%.",
    whatDidntWork:"Bundle promotion underperformed by ≈15% vs. modeled — cannibalized standalone service revenue rather than expanding wallet. Net-new revenue from the bundle was thin.",
    lessonLearned:"For OEM Tier-1, lead with industry events + CCO sponsorship (highest ROI lever). Treat bundle promo as a secondary, not primary, motion." },
  { id:"INI-2025-014",name:"Toyota production-cadence-aligned ABM playbook",account:"Toyota Motor NA",status:"completed",stage:"Outcome measured",owner:"Hashir Khan (VP, NA Strategic Mktg)",createdDate:"Mar 5, 2025",endDate:"Sep 22, 2025",modeledRev:16,actualRev:14,modeledWinRate:5.0,actualWinRate:4.4,notes:"Slightly below plan. JIT operational playbook landed well but cycle was longer than modeled.",levers:["Industry expert deployment","Multi-year contract incentive","Production-aligned cadence"],
    whatWorked:"JIT operational playbook resonated with logistics ops · monthly engagement frequency up 38%. Industry expert in Aichi territory built durable relationships.",
    whatDidntWork:"Production-cadence alignment stretched sales cycle by ≈3 months vs. modeled. Multi-year incentive economics weren't compelling enough to compress timing.",
    lessonLearned:"When aligning to customer production cadence, plan for 25–30% cycle drag in the modeled outcome. Reserve multi-year incentives for incremental capture only — not for closing speed." },
  { id:"INI-2025-027",name:"GM Detroit corridor — CCO + VP-Sales executive cadence",account:"General Motors",status:"in-execution",stage:"Quarter 3 of 4 in-flight",owner:"Pankaj Verma (Director, OEM Marketing)",createdDate:"Oct 14, 2025",endDate:"Jul 30, 2026",modeledRev:22,actualRev:18,modeledWinRate:4.0,actualWinRate:3.2,notes:"On track at quarter 3 of 4. Leading indicators positive (engagement frequency +47%).",levers:["Monthly CCO briefing","Industry expert (2)","NAAF capacity lock","Field marketing Detroit"],
    whatWorked:"Monthly CCO briefings + Detroit Industry Expert deployment lifted engagement frequency +47% — the single most powerful leading indicator. Closed-won pipeline conversion visibly trending toward plan.",
    whatDidntWork:"NAAF capacity lock alone didn't unlock new volume in Q1–Q2 — it protected existing share but didn't generate net-new without a bundled commercial offer attached.",
    lessonLearned:"CCO briefing cadence is the highest-leverage lever for OEM Tier-1 — keep it as the spine of any ABM ramp. Pair NAAF capacity with explicit commercial action; don't expect capacity protection to drive lift on its own." },
  { id:"INI-2026-002",name:"Aptiv penetration play — UPS Capital cross-sell ABM",account:"Aptiv PLC",status:"in-execution",stage:"Quarter 2 of 3 in-flight",owner:"Sreekar Pothula (Sr. Director, Auto Mktg)",createdDate:"Feb 18, 2026",endDate:"Nov 30, 2026",modeledRev:8,actualRev:6,modeledWinRate:6.0,actualWinRate:4.8,notes:"Cross-sell traction below plan; Capital attach slower than modeled.",levers:["Co-marketing (case study)","Solution architect overlay","Cross-sell bundle"],
    whatWorked:"Solution architect overlay opened CFO-level conversations that direct sales hadn't reached. Case-study co-marketing earned strong Aptiv-side advocacy.",
    whatDidntWork:"Capital cross-sell attach rate at 40% of target. New VP Logistics (ex-Penske) brought a different buying committee dynamic that the original playbook didn't account for.",
    lessonLearned:"When a key buyer changes at the customer, refresh the playbook before continuing — new buying committee dynamics can change cross-sell economics materially. Build a buyer-change trigger into ABM review cadence." },
];

const ENT_INITIATIVES = [
  { id:"PINI-2025-08",name:"L1 Accessorial concession ceiling tightened 22% → 20%",scope:"Portfolio · all Enterprise packets",status:"completed",stage:"Outcome measured · steady state",owner:"R. Patel (VP Revenue Management)",createdDate:"Aug 7, 2025",endDate:"Mar 31, 2026",modeledProfit:36,actualProfit:42,modeledMargin:1.4,actualMargin:1.6,notes:"Outperformed. Closed-won margin realization recovered 6pp. Some win-rate compression on Retention saves (≈-1.2pp) — within policy tolerance.",levers:["L1 Accessorial · FSC/RES/DAS"],affectedPackets:172,
    whatWorked:"Closed-won margin realization recovered 6pp · leakage at FSC/RES caps closed cleanly. Analyst guardrails held without escalation churn — the ceiling proved learnable for the analyst pool.",
    whatDidntWork:"Win-rate compression of ≈1.2pp on Retention saves — some price-sensitive saves slipped that would have closed under the old ceiling. Two packets pushed close to 20% required additional negotiation rounds.",
    lessonLearned:"Tightening accessorial ceilings is a clean lever for margin — but pair it with a win-rate watchlist on Retention to catch the secondary effect before it compounds across a quarter." },
  { id:"PINI-2025-11",name:"L2 Tier ceiling held at TARGET 81.1% (committee escalation for >TARGET)",scope:"Portfolio · all Enterprise packets",status:"completed",stage:"Outcome measured · policy permanent",owner:"R. Patel (VP Revenue Management) · CFO co-sign",createdDate:"Nov 12, 2025",endDate:"Apr 30, 2026",modeledProfit:48,actualProfit:46,modeledMargin:1.9,actualMargin:1.8,notes:"On plan. Blocked 23 packets from auto-stretching above TARGET; 7 of those proceeded via committee approval. Margin recovery solid.",levers:["L2 Tier ceiling"],affectedPackets:187,
    whatWorked:"Blocked 23 packets from auto-stretching above TARGET — clean policy enforcement. Committee escalation path worked cleanly for the 7 legitimate exceptions, with avg margin defended of 4.2pp on those approvals.",
    whatDidntWork:"Committee escalation latency averaged 11 days — too slow for time-bound deals. 2 packets withdrew the bid waiting on committee approval (≈$8M opportunity cost).",
    lessonLearned:"Hard ceilings work; escalation SLA matters more than the ceiling level. Build a 5-business-day expedite path for time-bound deals to prevent withdrawal losses on time-sensitive packets." },
  { id:"PINI-2026-03",name:"Senior Pricing Analyst overlay — Top-20 packets",scope:"Top-20 by bid value",status:"in-execution",stage:"Quarter 3 of 4 in-flight",owner:"R. Patel (VP Revenue Management)",createdDate:"Feb 1, 2026",endDate:"Jan 31, 2027",modeledProfit:18,actualProfit:14,modeledMargin:0.8,actualMargin:0.6,notes:"Leading indicator strong — average scenarios/packet up 2.4 → 3.6 on covered set. Capacity at 18/20 — 2 senior analysts on parental leave Q2.",levers:["Capacity · Senior analyst overlay"],affectedPackets:20,
    whatWorked:"Scenarios per packet up 2.4 → 3.6 on covered set — better-informed analyst recommendations visibly improving counter-proposal quality. Win rate on senior-covered packets +3.1pp vs uncovered comparable set.",
    whatDidntWork:"Coverage at 18/20 due to 2 senior analysts on parental leave Q2. The 2 high-bid uncovered packets traded down vs comparable covered packets — measurable coverage-gap penalty.",
    lessonLearned:"Plan for 90% effective capacity even at peak — leave hits coverage by ≈10%. Build the buffer into the FTE plan (i.e., size for 22 to deliver 20)." },
  { id:"PINI-2026-06",name:"AutoZone Packet 10941 · L2 single-use override · committee escalation",scope:"Single packet · AutoZone",status:"pending-approval",stage:"Routed for committee sign-off (3 days)",owner:"M. Guffey (CCO) · pending CFO + Pricing Cmte",createdDate:"Jun 7, 2026",endDate:"Pending",modeledProfit:0,actualProfit:0,modeledMargin:0,actualMargin:0,notes:"Analyst T. Whitaker staged S3 to match FedEx counter. Breaches L2 ceiling 81% → 143%. Modeled retention = $62M revenue saved · margin OR 0.70.",levers:["L2 Tier ceiling · single-use override"],affectedPackets:1,
    whatWorked:"(Pending decision) — playbook design borrowed from O'Reilly Auto 2024 override pattern, which closed 14% above modeled when paired with peak-season SLA commitment.",
    whatDidntWork:"(Pending decision) — assessment will follow committee outcome and 90-day post-closure margin tracking.",
    lessonLearned:"Reference O'Reilly Auto 2024: single-use override worked when paired with peak-season SLA + Happy Returns bundle. Apply same pairing logic on AutoZone if approved — don't approve the override standalone." },
  { id:"PINI-2026-04",name:"L0 DIM Divisor floor raised 145 → 150 (portfolio)",scope:"Portfolio · all Enterprise packets",status:"in-execution",stage:"Quarter 2 of 4 in-flight",owner:"R. Patel (VP Revenue Management) · CFO co-sign",createdDate:"Mar 14, 2026",endDate:"Mar 31, 2027",modeledProfit:22,actualProfit:18,modeledMargin:0.9,actualMargin:0.7,notes:"RPP recovery visible on low-density freight (auto parts, EV batteries). Some friction on aggressive new-logo entry — 3 packets requested 145 exception.",levers:["L0 DIM Divisor"],affectedPackets:187,
    whatWorked:"RPP recovery clearly visible on low-density freight (auto parts, EV batteries). Operating ratio improvement of 60 bps on covered freight. Portfolio rolling forward as modeled.",
    whatDidntWork:"3 new-logo packets requested 145 exception · 1 lost to FedEx because the higher floor blocked our entry-pricing position. Portfolio floor doesn't suit aggressive new-logo capture.",
    lessonLearned:"Portfolio floors don't fit new-logo aggression. Carve out a new-logo exception window with explicit margin guardrails so we don't lose entry deals to the floor itself." },
];

/* ------------------------------------------------------------------ ABM DEEP VIEW */
function ABMDeepView({ onBack, onCreateBrief, initialStep = 1 }) {
  const toast = useToast();
  const [screen, setScreen] = useState("biz-snapshot");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [leverVals, setLeverVals] = useState(() => {
    const d = {}; Object.entries(ABM_LEVERS_META).forEach(([k, v]) => { d[k] = v.default; }); return d;
  });
  const [simState, setSimState] = useState("idle");
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(1);
  const [appliedOption, setAppliedOption] = useState(null);
  const [resetFlash, setResetFlash] = useState(null);
  const [savingInitiative, setSavingInitiative] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushSent, setPushSent] = useState(false);
  const [pushChecked, setPushChecked] = useState([true, true, true, true]);

  const setLever = (key, val) => {
    setLeverVals(prev => ({ ...prev, [key]: val }));
    if (simState === "results" || simState === "applied") setSimState("idle");
  };
  const selAcct = selectedAccount || ABM_BAD_ACCOUNTS[0];
  const baseline = { rev: selAcct.actualRev, winRate: 55, cycle: 195, sow: selAcct.sow };

  const outcomeFor = (lv) => {
    const a = selAcct;
    const investBudgetLift = (lv.abmBudget - a.asIs.abmBudget) * 12;
    const execLift = (lv.execSponsor - a.asIs.execSponsor) * 3.4;
    const teamLift = (lv.accountTeam - a.asIs.accountTeam) * 5.0;
    const expertLift = (lv.industryExpert - a.asIs.industryExpert) * 5.6;
    const channelLift = (lv.channelMix - a.asIs.channelMix) * 0.08;
    const eventLift = (lv.industryEvents - a.asIs.industryEvents) * 1.4;
    const thoughtLift = (lv.thoughtLeadership - a.asIs.thoughtLeadership) * 1.8;
    const coMktLift = (lv.coMarketing - a.asIs.coMarketing) * 2.6;
    const naafLift = (lv.naafGuarantee - a.asIs.naafGuarantee) * 3.4;
    const bundleLift = (lv.bundle - a.asIs.bundle) * 2.4;
    const pilotLift = (lv.pilotOffer - a.asIs.pilotOffer) * 0.5;
    const peakLift = (lv.peakGuarantee - a.asIs.peakGuarantee) * 1.6;
    const revLift = investBudgetLift + execLift + teamLift + expertLift + channelLift + eventLift + thoughtLift + coMktLift + naafLift + bundleLift + pilotLift + peakLift;
    const winLift = (lv.execSponsor - a.asIs.execSponsor) * 1.2 + (lv.accountTeam - a.asIs.accountTeam) * 1.4 + (lv.industryExpert - a.asIs.industryExpert) * 1.4 + (lv.coMarketing - a.asIs.coMarketing) * 0.8 + (lv.naafGuarantee - a.asIs.naafGuarantee) * 1.3 + (lv.bundle - a.asIs.bundle) * 0.7;
    const cycleLift = -((lv.accountTeam - a.asIs.accountTeam) * 4 + (lv.industryExpert - a.asIs.industryExpert) * 5 + (lv.execSponsor - a.asIs.execSponsor) * 3 + (lv.naafGuarantee - a.asIs.naafGuarantee) * 3);
    const totalSpend = (lv.abmBudget * 1) + (lv.industryEvents * 0.18) + (lv.thoughtLeadership * 0.24) + (lv.coMarketing * 0.15) + (lv.execSponsor * 0.06) + (lv.industryExpert * 0.32) + (lv.accountTeam * 0.18);
    return { revLift, winLift, cycleLift, totalSpend };
  };

  const outcomes = useMemo(() => outcomeFor(leverVals), [leverVals, selAcct.id]);
  const asIsOut = useMemo(() => outcomeFor(selAcct.asIs), [selAcct.id]);

  const resetToAsIs = () => {
    setLeverVals({ ...selAcct.asIs });
    setSimState("idle");
    setResetFlash("asis");
    setTimeout(() => setResetFlash(null), 1800);
  };
  const resetToRecommended = () => {
    setLeverVals({ ...selAcct.recommended });
    setSimState("idle");
    setResetFlash("rec");
    setTimeout(() => setResetFlash(null), 1800);
  };

  const FY_BUDGET = 8.4;
  const FY_TEAM_CAP = 4.0;
  const FY_EXPERT_CAP = 3;
  const FY_EVENT_CAP = 12;

  const stagedCount = Object.keys(leverVals).filter(k => leverVals[k] !== selAcct.asIs[k]).length;
  const leverDisplayVal = (key) => { const m = ABM_LEVERS_META[key]; const v = leverVals[key]; return m.options ? (m.options[v] || v) : `${v}${m.unit}`; };
  const fmtLeverVal = (key, val) => { const m = ABM_LEVERS_META[key]; if (m.options) return m.options[val]; if (key === "abmBudget") return `$${val.toFixed(2)}M`; if (key === "channelMix") return `${val}% high-touch`; if (key === "accountTeam") return `${val} FTE`; if (key === "pilotOffer") return `${val} wks`; return `${val}${m.unit}`; };

  const totalGap = ABM_BAD_ACCOUNTS.reduce((s, a) => s + a.gap, 0);
  const recoverable = ABM_BAD_ACCOUNTS.reduce((s, a) => s + a.recommendedLift.rev, 0);

  const openAccount = (acct) => { setSelectedAccount(acct); setScreen("account-recs"); };

  const TRAJECTORY = [
    {q:"Q3 '24",plan:420,actual:428,recovered:null},{q:"Q4 '24",plan:438,actual:446,recovered:null},{q:"Q1 '25",plan:452,actual:464,recovered:null},{q:"Q2 '25",plan:466,actual:478,recovered:null},
    {q:"Q3 '25",plan:482,actual:490,recovered:null},{q:"Q4 '25",plan:498,actual:478,recovered:null},{q:"Q1 '26",plan:510,actual:468,recovered:null},{q:"Q2 '26",plan:528,actual:460,recovered:460},
    {q:"Q3 '26 (proj)",plan:544,actual:null,recovered:520},{q:"Q4 '26 (proj)",plan:562,actual:null,recovered:548},
  ];

  const LEVER_CATS = ["Investment & coverage", "Channel & marketing mix", "Promotional plays"];

  const Breadcrumb = ({ items }) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16, fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:C.faint }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color:C.faint, fontWeight:400 }}>›</span>}
          {it.onClick ? <button onClick={it.onClick} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:10, fontWeight:700, letterSpacing:".22em", textTransform:"uppercase", color:C.muted, padding:0, transition:`color .15s ${T.ease}` }}
            onMouseEnter={e => e.currentTarget.style.color = C.ink}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}>{it.label}</button>
            : <span style={{ color:C.goldDk, letterSpacing:".22em" }}>{it.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );

  /* ---- SCREEN: BUSINESS SNAPSHOT ---- */
  const renderBizSnapshot = () => {
    const KPIS = [
      { label:"Auto Revenue · YTD", value:"$1.84B", delta:"-$112M", deltaLabel:"vs plan ($1.95B)", status:"warn", sub:"-5.6% vs plan; reversed from +8% YTD '25" },
      { label:"ADV · Automotive", value:"4.4M", delta:"-3.1%", deltaLabel:"vs plan; -1.4% YoY", status:"warn", sub:"Volume pressure in Tier-1 OEM" },
      { label:"RPP · Automotive", value:"$18.92", delta:"+$0.34", deltaLabel:"vs plan · pricing intact", status:"ok", sub:"Mix shift up; not the problem" },
      { label:"Operating Margin", value:"8.4%", delta:"-180 bps", deltaLabel:"vs plan 10.2%", status:"warn", sub:"Volume miss flowing through" },
      { label:"Pipeline Coverage", value:"2.4×", delta:"-1.1×", deltaLabel:"vs 3.5× target", status:"warn", sub:"Tier-1 OEM coverage shortfall" },
    ];
    return (
      <div>
        {/* <Breadcrumb items={[{label:"Executive Home", onClick:onBack},{label:"Automotive Segment Growth"},{label:"Business Snapshot"}]} /> */}
        <SH kicker="Automotive Business Snapshot" title="Where the Auto segment stands — and where the gap is."
          sub="Five strategic parent accounts have reversed trends this year. Plan vs actual exposes the misallocation. Drill into any underperformer to see why and what to do."
          right={<div style={{display:"flex",gap:6}}><TagChip tone="brick">${Math.abs(totalGap)}M gap to plan</TagChip><TagChip tone="gold">+${recoverable}M recoverable</TagChip></div>} />

        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:24 }}>
          {KPIS.map((k,i) => (
            <KCard key={i} label={k.label} value={k.value} delta={k.delta} deltaLabel={k.deltaLabel} status={k.status} />
          ))}
        </div>

        <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 26px", marginBottom:24, boxShadow:T.shadow1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ width:14, height:1, background:T.goldFoil }} />
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Plan vs Actual · 8 quarters trailing</div>
              </div>
              <div style={{ fontFamily:DISP, fontWeight:600, fontSize:18, color:C.ink, letterSpacing:"-.005em" }}>Automotive segment revenue trajectory</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>Reversal began Q4 '25. Gap widening — driven by 5 specific strategic parent accounts.</div>
            </div>
            <span style={{ padding:"4px 10px", borderRadius:T.radPill, background:C.redBg, color:C.red, fontWeight:700, fontSize:10, letterSpacing:".14em", textTransform:"uppercase" }}>Gap Widening</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={TRAJECTORY} margin={{ top:10, right:30, bottom:5, left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line}/>
              <XAxis dataKey="q" tick={{ fontSize:10, fill:C.muted }} padding={{ left:10, right:10 }}/>
              <YAxis tick={{ fontSize:10, fill:C.muted }} tickFormatter={v=>`$${v}M`} domain={[400,570]}/>
              <Line type="monotone" dataKey="plan" name="Plan" stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 3" dot={{ r:3, fill:C.muted }}/>
              <Line type="monotone" dataKey="actual" name="Actual" stroke={C.gold} strokeWidth={2.5} dot={{ r:4, fill:C.gold }} connectNulls={false}/>
              <Line type="monotone" dataKey="recovered" name="If recovered" stroke={C.green} strokeWidth={2} strokeDasharray="4 3" dot={{ r:3, fill:C.green }} connectNulls={false}/>
              <Tooltip formatter={(v)=>v!=null?[`$${v}M`]:["—"]} contentStyle={{ borderRadius:T.radSm, border:`1px solid ${C.line2}`, fontSize:12 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:20, marginTop:10, fontSize:10.5, paddingTop:10, borderTop:`1px solid ${C.line}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:14, height:2, borderTop:`1.5px dashed ${C.muted}` }}/><span style={{color:C.muted, fontWeight:500}}>Plan</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:14, height:2, background:C.gold }}/><span style={{color:C.muted, fontWeight:500}}>Actual (reversed Q4 '25)</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:14, height:2, borderTop:`1.5px dashed ${C.green}` }}/><span style={{color:C.muted, fontWeight:500}}>Forward · if recovered via ABM</span></div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:28 }}>
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"20px 22px", boxShadow:T.shadow1, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:C.green, opacity:.55 }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", paddingBottom:14, borderBottom:`1px solid ${C.line}`, marginBottom:4, marginTop:4 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <TrendingUp size={12} color={C.green} />
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.green, textTransform:"uppercase" }}>Top performing</div>
                </div>
                <div style={{ fontSize:11.5, color:C.muted }}>Strategic Parent Accounts</div>
              </div>
              <span style={{ fontSize:10, color:C.green, fontWeight:700, padding:"3px 10px", background:C.greenBg, borderRadius:T.radPill, letterSpacing:".06em" }}>+$23M ahead</span>
            </div>
            {ABM_TOP_ACCOUNTS.map((a,i) => (
              <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:i<ABM_TOP_ACCOUNTS.length-1?`1px solid ${C.line}`:"none" }}>
                <div><div style={{ fontWeight:600, fontSize:13.5, color:C.ink, letterSpacing:"-.005em" }}>{a.name}</div><div style={{ fontSize:10, color:C.faint, marginTop:2, letterSpacing:".06em" }}>{a.tier} · {a.subv}</div></div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:9.5, color:C.faint, letterSpacing:".08em" }}>Plan / Actual</div>
                  <div style={{ fontSize:11.5, color:C.ink2 }}>${a.planRev}M / <strong style={{ color:C.green }}>${a.actualRev}M</strong></div>
                  <div style={{ fontFamily:DISP, fontWeight:600, color:C.green, fontSize:13, letterSpacing:"-.005em" }}>+${a.gap}M (+{a.gapPct.toFixed(1)}%)</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"20px 22px", boxShadow:T.shadow2, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:C.red, opacity:.7 }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", paddingBottom:14, borderBottom:`1px solid ${C.line}`, marginTop:4 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <AlertTriangle size={12} color={C.red} />
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.red, textTransform:"uppercase" }}>Underperforming · action required</div>
                </div>
                <div style={{ fontSize:11.5, color:C.muted }}>Strategic Parent Accounts. <span style={{ color:C.goldDk, fontWeight:600, textDecoration:"", textUnderlineOffset:3 }}>Click on account to view details</span></div>
              </div>
              <span style={{ fontSize:10, color:C.red, fontWeight:700, padding:"3px 10px", background:C.redBg, borderRadius:T.radPill, letterSpacing:".06em" }}>−${Math.abs(totalGap)}M</span>
            </div>
            {ABM_BAD_ACCOUNTS.map((a,i) => (
              <button key={a.id} onClick={() => openAccount(a)}
                style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 2px", width:"100%", background:"transparent", border:"none", borderBottom:`1px solid ${C.line}`, cursor:"pointer", fontFamily:FONT, textAlign:"left", transition:`background .15s ${T.ease}` }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.red}05`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:999, background:C.red, flexShrink:0, boxShadow:`0 0 0 3px ${C.red}18` }}/>
                  <div><div style={{ fontWeight:600, fontSize:13.5, color:C.ink, letterSpacing:"-.005em" }}>{a.name}</div><div style={{ fontSize:10, color:C.faint, marginTop:2, letterSpacing:".06em" }}>{a.tier} · {a.subv} · {a.quartersDeclining}Q declining</div></div>
                </div>
                <div style={{ textAlign:"right", display:"flex", alignItems:"center", gap:14 }}>
                  <div>
                    <div style={{ fontSize:9.5, color:C.faint, letterSpacing:".08em" }}>Plan / Actual</div>
                    <div style={{ fontSize:11.5, color:C.ink2 }}>${a.planRev}M / <strong style={{ color:C.red }}>${a.actualRev}M</strong></div>
                  </div>
                  <div><div style={{ fontSize:9.5, color:C.faint, letterSpacing:".08em" }}>Gap</div><div style={{ fontFamily:DISP, fontWeight:600, color:C.red, fontSize:13 }}>{a.gap}M</div></div>
                  <div><div style={{ fontSize:9.5, color:C.faint, letterSpacing:".08em" }}>Recoverable</div><div style={{ fontFamily:DISP, fontWeight:600, color:C.goldDk, fontSize:13 }}>+${a.recommendedLift.rev}M</div></div>
                  <div style={{ width:24, height:24, borderRadius:999, background:`${C.gold}12`, display:"grid", placeItems:"center", flexShrink:0 }}><ChevronRight size={14} color={C.goldDk}/></div>
                </div>
              </button>
            ))}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:14, marginTop:4, borderTop:`1px solid ${C.line}` }}>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.5, maxWidth:"65%" }}>Select an account to view intelligence and configure strategic marketing levers.</div>
              <button onClick={() => { if (ABM_BAD_ACCOUNTS.length > 0) openAccount(ABM_BAD_ACCOUNTS[0]); }} style={{ fontSize:11, fontWeight:700, padding:"8px 16px", borderRadius:T.radSm, background:T.goldFoil, color:C.navBg, border:"none", cursor:"pointer", fontFamily:FONT, letterSpacing:".12em", textTransform:"uppercase", whiteSpace:"nowrap" }}>Move to Account Intelligence →</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---- SCREEN: ACCOUNT RECOMMENDATIONS ---- */
  const renderAccountRecs = () => {
    const a = selAcct;
    return (
      <div>
        {/* <Breadcrumb items={[{label:"Executive Home", onClick:onBack},{label:"Automotive Segment Growth", onClick:()=>setScreen("biz-snapshot")},{label:"Business Snapshot", onClick:()=>setScreen("biz-snapshot")},{label:a.name}]} /> */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <button onClick={() => setScreen("biz-snapshot")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:11, fontWeight:700, letterSpacing:".1em", color:C.muted, textTransform:"uppercase", padding:0 }}>← Back to Business Snapshot</button>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:C.card, border:`1px solid ${C.line}`, borderRadius:8, padding:"4px 10px" }}>
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", color:C.muted, textTransform:"uppercase" }}>Account</span>
              <select value={a.id} onChange={e => { const acct = ABM_BAD_ACCOUNTS.find(x => x.id === e.target.value); if (acct) setSelectedAccount(acct); }}
                style={{ background:"transparent", border:"none", fontFamily:FONT, fontSize:12, fontWeight:600, color:C.ink, cursor:"pointer", outline:"none", paddingRight:12 }}>
                {ABM_BAD_ACCOUNTS.map(ac => <option key={ac.id} value={ac.id}>{ac.name}</option>)}
              </select>
            </div>
            {/* <Btn kind="ghost" small onClick={() => { const idx = ABM_BAD_ACCOUNTS.findIndex(x => x.id === a.id); if (idx > 0) setSelectedAccount(ABM_BAD_ACCOUNTS[idx-1]); }}>← Prev</Btn> */}
            {/* <Btn kind="ghost" small onClick={() => { const idx = ABM_BAD_ACCOUNTS.findIndex(x => x.id === a.id); if (idx < ABM_BAD_ACCOUNTS.length - 1) setSelectedAccount(ABM_BAD_ACCOUNTS[idx+1]); }}>Next →</Btn> */}
          </div>
        </div>

        <div style={{ marginBottom:24, marginTop:10 }}>
          {/* <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase" }}>Account Intelligence · Automotive drill-down</div>
            <TagChip>{a.tier} · {a.subv}</TagChip>
            <TagChip tone="brick">Trend reversed · {a.quartersDeclining}Q declining</TagChip>
          </div> */}
          <div style={{ fontFamily:DISP, fontWeight:300, fontSize:36, color:C.ink, lineHeight:1.05 }}>{a.name}</div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, opacity:.5 }} />
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:10 }}>Plan · FY26</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:36, color:C.ink, lineHeight:1, letterSpacing:"-.02em" }}>${a.planRev}M</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Annualized revenue target</div>
          </div>
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, opacity:.5 }} />
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:10 }}>Actual · YTD pace</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:36, color:C.ink, lineHeight:1, letterSpacing:"-.02em" }}>${a.actualRev}M</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Run-rate vs plan</div>
          </div>
          <div style={{ background:`${C.red}04`, border:`1px solid ${C.red}30`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:C.red }} />
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", color:C.red, textTransform:"uppercase", marginBottom:10 }}>Gap to Close</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:36, color:C.red, lineHeight:1, letterSpacing:"-.02em" }}>${Math.abs(a.gap)}M</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{a.gapPct}% below plan · {a.quartersDeclining}Q declining</div>
          </div>
          <div style={{ background:`${C.gold}04`, border:`1px solid ${C.gold}30`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:C.gold }} />
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase", marginBottom:10 }}>Recommended Lift</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:36, color:C.goldDk, lineHeight:1, letterSpacing:"-.02em" }}>+${a.recommendedLift.rev}M</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>If recommended ABM play applied · {Math.round((a.recommendedLift.rev / Math.abs(a.gap)) * 100)}% of gap recovered</div>
          </div>
        </div>

        {/* WHY THE TREND REVERSED — full-width stacked panel (brick accent) */}
        <div style={{ background:`${C.red}03`, border:`1px solid ${C.red}30`, borderRadius:T.radLg, padding:"22px 26px", marginBottom:18, boxShadow:T.shadow1 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".22em", color:C.red, textTransform:"uppercase" }}>◆ Why the trend reversed</div>
            <div style={{ fontSize:10, color:C.faint }}>factual root-cause · linked to live signals</div>
          </div>
          <p style={{ fontSize:14, color:C.ink, lineHeight:1.65, margin:"0 0 16px 0", maxWidth:"56em" }}>{a.rootCause}</p>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", color:C.muted, textTransform:"uppercase", marginBottom:8 }}>Causal signals driving the gap</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {a.signals.map((sig,j) => (
                <div key={j} style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:12 }}>
                  <span style={{ width:6, height:6, borderRadius:999, marginTop:6, flexShrink:0, background:sig.weight==="high"?C.red:C.amber }} />
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", padding:"2px 7px", borderRadius:T.radSm, background:C.line, color:C.muted, flexShrink:0 }}>{sig.type}</span>
                  <span style={{ color:C.ink2, lineHeight:1.45, flex:1 }}>{sig.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LOOKALIKE CUSTOMER — full-width stacked panel (teal accent) */}
        <div style={{ background:`${C.green}03`, border:`1px solid ${C.green}30`, borderRadius:T.radLg, padding:"22px 26px", marginBottom:18, boxShadow:T.shadow1 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".22em", color:C.green, textTransform:"uppercase" }}>◆ Lookalike Customer</div>
            <div style={{ fontSize:10, color:C.faint }}>closest analog in our portfolio · similarity by size + behavior</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"3fr 9fr", gap:24 }}>
            <div>
              <div style={{ fontFamily:DISP, fontWeight:300, fontSize:30, lineHeight:1.1, color:C.green }}>{a.analog.name}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:8 }}>Lookalike for {a.name}</div>
              <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:"12px 14px", marginTop:16 }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.muted, textTransform:"uppercase", marginBottom:6 }}>Outcome on analog</div>
                <div style={{ fontFamily:DISP, fontSize:13, color:C.green }}>{a.analog.outcomeLift}</div>
                <div style={{ fontSize:9, color:C.faint, marginTop:6 }}>{a.analog.outcomeQuarters} quarters from start</div>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {a.analog.traits && (
                <>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", color:C.muted, textTransform:"uppercase", marginBottom:6 }}>Comparable traits (size + behavior)</div>
                    <p style={{ fontSize:13, color:C.ink, lineHeight:1.6, margin:0 }}>{a.analog.traits}</p>
                  </div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", color:C.muted, textTransform:"uppercase", marginBottom:6 }}>What worked on the analog</div>
                    <p style={{ fontSize:13, color:C.ink, lineHeight:1.6, margin:0 }}>{a.analog.behavior}</p>
                  </div>
                  <div style={{ borderTop:`1px solid ${C.green}22`, paddingTop:12 }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", color:C.muted, textTransform:"uppercase", marginBottom:6 }}>Why this resonates for {a.name}</div>
                    <p style={{ fontSize:13, lineHeight:1.6, margin:0, color:C.green }}>{a.analog.whyResonates}</p>
                  </div>
                </>
              )}
              {!a.analog.traits && <p style={{ fontSize:13, color:C.ink, lineHeight:1.6, margin:0 }}>{a.analog.playbook}</p>}
            </div>
          </div>
        </div>

        {/* RECOMMENDED ABM PLAY — full-width stacked panel (gold accent) */}
        <div style={{ background:`${C.gold}03`, border:`1px solid ${C.gold}30`, borderRadius:T.radLg, padding:"22px 26px", marginBottom:18, boxShadow:T.shadow1 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase" }}>◆ Recommended ABM Play</div>
            <div style={{ fontSize:10, color:C.faint }}>derived from {a.analog.name} playbook · adapted to {a.name} context</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"8fr 4fr", gap:24 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", color:C.muted, textTransform:"uppercase", marginBottom:8 }}>The play</div>
              {a.playBullets && a.playBullets.length > 0 && (
                <ul style={{ margin:0, padding:0, listStyle:"none" }}>
                  {a.playBullets.map((b,bi) => (
                    <li key={bi} style={{ fontSize:13, color:C.ink2, lineHeight:1.6, marginBottom:8, display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ color:C.goldDk, fontSize:14, lineHeight:1, flexShrink:0, marginTop:3 }}>●</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:"14px 16px", marginBottom:12 }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.muted, textTransform:"uppercase", marginBottom:8 }}>Modeled outcome on {a.name}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}><span>Revenue lift</span><span style={{ fontFamily:DISP, fontWeight:600, color:C.goldDk }}>+${a.recommendedLift.rev}M</span></div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}><span>Win rate Δ</span><span style={{ fontFamily:DISP, fontWeight:600 }}>+{a.recommendedLift.winRate}pp</span></div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}><span>Cycle Δ</span><span style={{ fontFamily:DISP, fontWeight:600 }}>{a.recommendedLift.cycle}d</span></div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}><span>Gap closure</span><span style={{ fontFamily:DISP, fontWeight:600, color:C.green }}>{Math.round((a.recommendedLift.rev / Math.abs(a.gap)) * 100)}%</span></div>
                </div>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:"14px 16px" }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.muted, textTransform:"uppercase", marginBottom:8 }}>Confidence in outcome</div>
                {(() => {
                  const confLevel = a.name === "Tesla" ? 3 : 4;
                  const confLabel = confLevel <= 3 ? "Medium" : "High";
                  const confColor = confLevel <= 3 ? C.amber : C.green;
                  return (
                    <>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <div style={{ display:"flex", gap:3 }}>
                          {[1,2,3,4,5].map(i => (
                            <div key={i} style={{ width:8, height:16, borderRadius:2, background:i<=confLevel?confColor:C.line }} />
                          ))}
                        </div>
                        <div style={{ fontFamily:DISP, fontSize:15, color:confColor }}>{confLabel}</div>
                      </div>
                      <div style={{ fontSize:11, color:C.muted, lineHeight:1.45 }}>
                        {confLevel <= 3 ? `${a.name} has high variance — outcome range wider than other accounts.` : `Based on ${a.analog.name}'s actual outcome on a similar playbook.`} Materializes over <span style={{ fontFamily:DISP, color:C.ink }}>{a.analog.outcomeQuarters} quarters</span>.
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* CTA — Open ABM Experiment Workbench */}
        <button onClick={() => { if (a.recommended) setLeverVals(a.recommended); setScreen("abm-workbench"); }}
          style={{ width:"100%", textAlign:"left", background:`linear-gradient(135deg, ${C.gold}14 0%, transparent 60%)`, border:`1.5px solid ${C.gold}`, borderRadius:T.radLg, padding:"22px 26px", cursor:"pointer", fontFamily:FONT, position:"relative", overflow:"hidden", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadow2, transition:`transform .2s ${T.ease}, box-shadow .2s ${T.ease}` }}
          onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase", marginBottom:8 }}>Next step →</div>
            <div style={{ fontFamily:DISP, fontWeight:300, fontSize:24, color:C.ink, lineHeight:1.1, marginBottom:8 }}>Open the ABM Experiment Workbench.</div>
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.6, margin:0, maxWidth:"40em" }}>
              The Workbench is pre-loaded with the recommended ABM lever configuration for {a.name}. You'll see the <span style={{ color:C.goldDk }}>As-Is vs To-Be comparison</span> side-by-side, the UPS Marketing Constraints budget check, Channel ROI shifts, and three optimized simulation options to choose from.
            </p>
          </div>
          <div style={{ fontSize:28, color:C.goldDk, flexShrink:0, marginLeft:24 }}>→</div>
        </button>
      </div>
    );
  };

  /* ---- SCREEN: ABM EXPERIMENT WORKBENCH ---- */
  const LEVER_CATEGORIES = [
    { label:"Investment & Coverage", keys:["abmBudget","execSponsor","accountTeam","industryExpert"], color:C.goldDk, bgColor:`${C.gold}08`, borderColor:`${C.gold}44` },
    { label:"Channel & Marketing Mix", keys:["channelMix","industryEvents","thoughtLeadership","coMarketing"], color:C.green, bgColor:`${C.green}08`, borderColor:`${C.green}44` },
    { label:"Promotional Plays", keys:["naafGuarantee","bundle","pilotOffer","peakGuarantee"], color:C.brandLt, bgColor:`${C.brandLt}0D`, borderColor:`${C.brandLt}4D` },
  ];

  const simOptions = useMemo(() => {
    const a = selAcct;
    const optConservative = {};
    const optBalanced = { ...a.recommended };
    const optAggressive = {};
    Object.keys(a.recommended).forEach(k => {
      if (typeof a.recommended[k] === "number" && !Number.isInteger(a.recommended[k])) {
        optConservative[k] = +((a.asIs[k] + a.recommended[k]) / 2).toFixed(2);
        optAggressive[k] = Math.min(ABM_LEVERS_META[k].max, +(a.recommended[k] * 1.35).toFixed(2));
      } else {
        optConservative[k] = Math.round((a.asIs[k] + a.recommended[k]) / 2);
        optAggressive[k] = Math.min(ABM_LEVERS_META[k].max, a.recommended[k] + 1);
      }
    });
    const conOut = outcomeFor(optConservative);
    const balOut = outcomeFor(optBalanced);
    const aggOut = outcomeFor(optAggressive);
    return [
      { id:0, label:"Conservative", tag:"Lower spend · modest lift", color:C.green, leverVec:optConservative, out:conOut, rev:conOut.revLift, winRate:conOut.winLift, cycle:conOut.cycleLift, spend:conOut.totalSpend, risk:"Low", keyMoves:["Hold ABM budget · reallocate channel mix only","Add 1 exec briefing/qtr · no new headcount","Keep promotional plays light"], confidence:"P50 · ±$5M" },
      { id:1, label:"Balanced · Recommended", tag:"AI lookalike pick", color:C.goldDk, leverVec:optBalanced, out:balOut, rev:balOut.revLift, winRate:balOut.winLift, cycle:balOut.cycleLift, spend:balOut.totalSpend, risk:"Medium", keyMoves:["Lift ABM budget · NAFA + Industry Summit","CCO + segment GM monthly briefings","Multi-service bundle + NAAF capacity guarantee"], confidence:"P50 · ±$8M" },
      { id:2, label:"Aggressive", tag:"Maximum lift · higher spend", color:C.amber, leverVec:optAggressive, out:aggOut, rev:aggOut.revLift, winRate:aggOut.winLift, cycle:aggOut.cycleLift, spend:aggOut.totalSpend, risk:"Higher", keyMoves:["Lift ABM budget · full event sponsorship","Dedicated Industry Expert (new hire required)","All 4 promotional plays · 8-week pilot + peak guarantee"], confidence:"P50 · ±$14M" },
    ];
  }, [selAcct.id]);

  const renderWorkbench = () => {
    const a = selAcct;
    const onResultsScreen = screen === "abm-results";
    return (
      <div>
        {/* <Breadcrumb items={onResultsScreen ? [
          {label:"Executive Home", onClick:onBack},
          {label:"Automotive Segment Growth", onClick:()=>setScreen("biz-snapshot")},
          {label:a.name, onClick:()=>setScreen("account-recs")},
          {label:"ABM Workbench", onClick:()=>setScreen("abm-workbench")},
          {label:"Results"},
        ] : [
          {label:"Executive Home", onClick:onBack},
          {label:"Automotive Segment Growth", onClick:()=>setScreen("biz-snapshot")},
          {label:a.name, onClick:()=>setScreen("account-recs")},
          {label:"ABM Experiment Workbench"},
        ]} /> */}
        {!onResultsScreen && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <button onClick={() => setScreen("account-recs")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:11, fontWeight:700, letterSpacing:".1em", color:C.muted, textTransform:"uppercase", padding:0 }}>← Back to {a.name} recommendations</button>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={resetToAsIs} style={{ background:"none", border:`1px solid ${C.line}`, cursor:"pointer", fontFamily:FONT, fontSize:10, fontWeight:700, letterSpacing:".1em", color:resetFlash==="asis"?C.green:C.muted, padding:"5px 12px", borderRadius:6, borderColor:resetFlash==="asis"?C.green:C.line, textTransform:"uppercase" }}>{resetFlash==="asis"?"✓ As-Is restored":"↺ Reset to As-Is"}</button>
              <button onClick={resetToRecommended} style={{ background:"none", border:`1px solid ${C.gold}55`, cursor:"pointer", fontFamily:FONT, fontSize:10, fontWeight:700, letterSpacing:".1em", color:resetFlash==="rec"?C.goldDk:C.goldDk, padding:"5px 12px", borderRadius:6, borderColor:resetFlash==="rec"?C.goldDk:`${C.gold}55`, textTransform:"uppercase" }}>{resetFlash==="rec"?"✓ Recommended restored":"↻ Reset to Recommended"}</button>
            </div>
          </div>
        )}

        {onResultsScreen ? (
          <SH kicker={`Results · ${a.name} · ${appliedOption ? appliedOption.label : "—"}`}
            title="Impact on the account — visualised."
            sub="Plan-vs-Actual recovery trajectory, phased timeline, and route-to-execution panel."
            right={<div style={{display:"flex",gap:6}}><TagChip tone="gold">+${appliedOption?Math.round(appliedOption.rev):0}M lift</TagChip></div>} />
        ) : (
          <SH kicker={`Account Based Marketing (ABM Experiment Workbench) · ${a.name}`} title="Pull the marketing levers. See the impact."
            sub="CCO-grade strategic marketing & promotion levers. Move sliders to model impact on revenue, win rate, and cycle."
            right={<div style={{display:"flex",gap:6}}><TagChip>Account: {a.name}</TagChip><TagChip tone="gold">{stagedCount} levers staged</TagChip></div>} />
        )}

        {!onResultsScreen && (<>
        {/* workbench-only content below */}

        {/* Top 4 KPI cards — Plan / Actual / Gap / Modeled Lift */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, opacity:.5 }} />
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:10 }}>Plan · FY26</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:30, color:C.ink, letterSpacing:"-.02em", lineHeight:1 }}>${a.planRev}M</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Annualized target</div>
          </div>
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, opacity:.5 }} />
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:10 }}>Actual · YTD pace</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:30, color:C.ink, letterSpacing:"-.02em", lineHeight:1 }}>${a.actualRev}M</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Run-rate</div>
          </div>
          <div style={{ background:`${C.red}06`, border:`1.5px solid ${C.red}44`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:C.red }} />
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.red, textTransform:"uppercase", marginBottom:10 }}>Gap to Close</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:30, color:C.red, letterSpacing:"-.02em", lineHeight:1 }}>${Math.abs(a.gap)}M</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{a.gapPct}% below plan</div>
          </div>
          <div style={{ background:`${C.gold}08`, border:`1.5px solid ${C.gold}55`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:C.goldDk }} />
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase", marginBottom:10 }}>Modeled Lift</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:30, color:C.goldDk, letterSpacing:"-.02em", lineHeight:1 }}>+${Math.round(outcomes.revLift)}M</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{Math.round((outcomes.revLift / Math.abs(a.gap)) * 100)}% of gap · +{outcomes.winLift.toFixed(1)}pp win rate</div>
          </div>
        </div>

        {/* Section header */}
        {/* <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase", marginBottom:6 }}>As-Is vs To-Be · ABM Lever Configuration</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.55, maxWidth:700 }}>Twelve strategic levers across three categories. <span style={{color:C.faint}}>As-Is</span> is the current state at {a.name}. <span style={{color:C.goldDk}}>To-Be</span> is your staged configuration (drag to adjust). Gold value = changed from As-Is.</div>
        </div> */}

        {/* 8:4 grid — Lever tables (left) + Sidebar panels (right) */}
        <div style={{ display:"grid", gridTemplateColumns:"8fr 4fr", gap:16, marginBottom:24 }}>
          {/* LEFT: Lever tables */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {LEVER_CATEGORIES.map(cat => (
              <div key={cat.label} style={{ background:T.cardElevated, border:`1.5px solid ${cat.borderColor}`, borderRadius:T.radLg, overflow:"hidden" }}>
                <div style={{ padding:"10px 18px", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${C.line}`, background:cat.bgColor }}>
                  <div style={{ width:3, height:14, borderRadius:2, background:cat.color }} />
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:cat.color, textTransform:"uppercase" }}>{cat.label}</div>
                  <div style={{ fontSize:9, color:C.faint, marginLeft:"auto" }}>{cat.keys.length} levers</div>
                </div>
                {/* Table header */}
                <div style={{ display:"grid", gridTemplateColumns:"32% 12% 6% 16% 34%", padding:"6px 18px", fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.faint, textTransform:"uppercase", borderBottom:`1px solid ${C.line}` }}>
                  <span>Lever</span><span style={{textAlign:"right"}}>As-Is</span><span /><span style={{color:cat.color}}>To-Be</span><span style={{color:C.faint, fontWeight:600}}>Adjust</span>
                </div>
                {/* Lever rows */}
                {cat.keys.map((key, ki) => {
                  const meta = ABM_LEVERS_META[key];
                  const isChanged = leverVals[key] !== a.asIs[key];
                  const isAtRecommended = leverVals[key] === a.recommended[key];
                  return (
                    <div key={key} style={{ display:"grid", gridTemplateColumns:"32% 12% 6% 16% 34%", padding:"10px 18px", borderBottom:ki<cat.keys.length-1?`1px solid ${C.line}`:"none", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:12, color:C.ink, lineHeight:1.3 }}>{meta.title}</div>
                        {meta.constraint && <div style={{ fontSize:10, color:C.faint, marginTop:2 }}>{meta.constraint}</div>}
                      </div>
                      <div style={{ textAlign:"right", fontSize:12, color:C.muted, fontFamily:DISP }}>{fmtLeverVal(key, a.asIs[key])}</div>
                      <div style={{ textAlign:"center", fontSize:16, color:isChanged?cat.color:C.faint }}>→</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:isChanged?700:400, color:isChanged?cat.color:C.muted, fontFamily:DISP }}>{fmtLeverVal(key, leverVals[key])}</div>
                        {isAtRecommended && isChanged && <div style={{ fontSize:8, fontWeight:700, letterSpacing:".1em", color:C.goldDk, textTransform:"uppercase", marginTop:2 }}>✓ Recommended</div>}
                      </div>
                      <div style={{ display:"flex", alignItems:"center" }}>
                        <input type="range" min={meta.min} max={meta.max} step={meta.step} value={leverVals[key]} onChange={e => setLever(key, +e.target.value)} style={{ width:"100%", accentColor:isChanged?cat.color:C.brandLt }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* RIGHT: Sidebar panels */}
          <div style={{ display:"flex", flexDirection:"column", gap:14, position:"sticky", top:20, alignSelf:"start" }}>
            {/* UPS Marketing Constraints */}
            <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1 }}>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase", marginBottom:10 }}>UPS Marketing Constraints</div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:14, lineHeight:1.4 }}>FY26 constraints visible against your staged To-Be vector.</div>
              {[
                { label:"Account marketing spend", used:outcomes.totalSpend, total:FY_BUDGET, unit:"M", prefix:"$", asIs:asIsOut.totalSpend },
                { label:"Account team capacity", used:leverVals.accountTeam, total:FY_TEAM_CAP, unit:" FTE", asIs:a.asIs.accountTeam },
                { label:"Senior industry experts", used:leverVals.industryExpert, total:FY_EXPERT_CAP, unit:"", asIs:a.asIs.industryExpert },
                { label:"Marquee event calendar", used:leverVals.industryEvents, total:FY_EVENT_CAP, unit:"", asIs:a.asIs.industryEvents },
              ].map((c, ci) => {
                const pct = Math.min(100, (c.used / c.total) * 100);
                const asIsPct = (c.asIs / c.total) * 100;
                const over = c.used > c.total;
                return (
                  <div key={ci} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                      <span style={{ color:C.muted }}>{c.label}</span>
                      <span style={{ fontFamily:DISP, fontSize:10, fontWeight:600, color:over?C.red:pct>80?C.amber:C.goldDk }}>{c.prefix||""}{c.used.toFixed(c.unit==="M"?2:c.unit===" FTE"?1:0)}{c.unit} / {c.prefix||""}{c.total}{c.unit}</span>
                    </div>
                    <div style={{ height:6, borderRadius:T.radPill, background:C.line, overflow:"hidden", position:"relative" }}>
                      <div style={{ position:"absolute", top:0, bottom:0, width:1, background:C.muted, left:`${asIsPct}%`, zIndex:2 }} />
                      <div style={{ height:"100%", width:`${pct}%`, background:over?C.red:pct>80?C.amber:C.goldDk, borderRadius:T.radPill }} />
                    </div>
                    <div style={{ fontSize:8, color:C.faint, marginTop:3, letterSpacing:".06em" }}>As-Is: {c.prefix||""}{c.asIs.toFixed(c.unit==="M"?2:c.unit===" FTE"?1:0)}{c.unit} · marker shown</div>
                  </div>
                );
              })}
            </div>

            {/* Channel ROI */}
            {a.marketing && (
              <div style={{ background:T.cardElevated, border:`1px solid ${C.green}33`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1 }}>
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.green, textTransform:"uppercase", marginBottom:8 }}>Channel ROI · {a.name}</div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:10, lineHeight:1.4 }}>
                  Blended ROI: <span style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:a.marketing.blendedROI>=a.marketing.benchmarkROI?C.green:C.amber }}>{a.marketing.blendedROI.toFixed(1)}x</span>
                  <span style={{ marginLeft:6, color:C.faint }}>benchmark: {a.marketing.benchmarkROI.toFixed(1)}x</span>
                </div>
                {a.marketing.channels.map((ch, ci) => {
                  const maxROI = Math.max(...a.marketing.channels.map(c => c.roi));
                  const pct = (ch.roi / maxROI) * 100;
                  const stColor = ch.status==="under-invested"?C.amber:ch.status==="over-invested"?C.red:C.green;
                  return (
                    <div key={ci} style={{ marginBottom:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:2 }}>
                        <span style={{ color:C.muted, flex:1, marginRight:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ch.name}</span>
                        <span style={{ fontFamily:DISP, fontSize:11, fontWeight:600, color:ch.roi>=5?C.green:ch.roi>=3?C.ink:C.amber }}>{ch.roi.toFixed(1)}x</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ flex:1, height:3, borderRadius:T.radPill, background:C.line, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:stColor, borderRadius:T.radPill }} />
                        </div>
                        <span style={{ fontSize:8, fontWeight:700, color:stColor, textTransform:"uppercase", letterSpacing:".1em", width:36, textAlign:"right" }}>{ch.status==="under-invested"?"Under":ch.status==="over-invested"?"Over":"OK"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Simulated vs As-Is quick read */}
            <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1 }}>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase", marginBottom:10 }}>Simulated vs As-Is · quick read</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>Revenue Δ</div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:18, color:C.goldDk }}>+${Math.round(outcomes.revLift)}M</div>
                </div>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>Spend Δ</div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:18, color:outcomes.totalSpend>asIsOut.totalSpend?C.amber:C.green }}>{outcomes.totalSpend>asIsOut.totalSpend?"+":""}${(outcomes.totalSpend - asIsOut.totalSpend).toFixed(2)}M</div>
                </div>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>Win rate Δ</div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:18, color:C.ink }}>+{outcomes.winLift.toFixed(1)}pp</div>
                </div>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>Cycle Δ</div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:18, color:C.ink }}>{Math.round(outcomes.cycleLift)}d</div>
                </div>
              </div>
              <div style={{ fontSize:10, color:C.faint, marginTop:10, paddingTop:10, borderTop:`1px solid ${C.line}`, lineHeight:1.5 }}>Gap closure: <span style={{ fontFamily:DISP, fontWeight:600, color:C.goldDk }}>{Math.round((outcomes.revLift / Math.abs(a.gap)) * 100)}%</span> of ${Math.abs(a.gap)}M gap. Levers changed: <span style={{ fontFamily:DISP, fontWeight:600, color:C.goldDk }}>{stagedCount}/12</span>. Outcome over <span style={{ fontFamily:DISP, fontWeight:600 }}>{a.analog.outcomeQuarters} quarters</span> per {a.analog.name} analog.</div>
            </div>
          </div>
        </div>

        {/* --- SIMULATION FLOW --- */}
        {simState === "idle" && (
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 26px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadow2, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, opacity:.5 }} />
            <div>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, marginBottom:6, textTransform:"uppercase" }}>Modeled Outcome · {a.name} · FY26</div>
              <div style={{ fontSize:15, lineHeight:1.7 }}>
                <span style={{ fontFamily:DISP, fontWeight:600, color:C.goldDk, fontSize:18, letterSpacing:"-.01em" }}>+${Math.round(outcomes.revLift)}M revenue</span>
                <span style={{ color:C.faint, margin:"0 8px" }}>·</span>
                <span style={{ color:C.ink }}>+{outcomes.winLift.toFixed(1)}pp win rate</span>
                <span style={{ color:C.faint, margin:"0 8px" }}>·</span>
                <span style={{ color:C.ink }}>{Math.round(outcomes.cycleLift)}d cycle</span>
                <span style={{ color:C.faint, margin:"0 8px" }}>·</span>
                <span style={{ color:C.ink }}>${outcomes.totalSpend.toFixed(2)}M spend</span>
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:6, lineHeight:1.5 }}>Run simulator to generate three optimised lever configurations and visualise impact on Plan-vs-Actual trajectory.</div>
            </div>
            <div style={{ display:"flex", gap:10, flexShrink:0, marginLeft:24 }}>
              <Btn kind="ghost" small onClick={resetToAsIs}>↺ Reset</Btn>
              <Btn kind="gold" onClick={() => { setSimState("running"); setTimeout(() => setSimState("results"), 2200); }}>
                <Play size={13}/> Generate Options
              </Btn>
            </div>
          </div>
        )}

        {simState === "running" && (
          <div style={{ background:T.cardElevated, border:`1px solid ${C.gold}55`, borderRadius:T.radLg, padding:"28px 32px", boxShadow:T.shadowGoldGlow, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, animation:"pulse 1.4s infinite" }} />
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:999, display:"grid", placeItems:"center", background:`${C.gold}10`, border:`1.5px solid ${C.gold}55`, boxShadow:T.shadowGoldGlow }}>
                <Loader2 size={20} color={C.goldDk} style={{ animation:"spin 1s linear infinite" }}/>
              </div>
              <div>
                <div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:C.ink, letterSpacing:"-.01em" }}>Running simulation against analog playbooks…</div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:".24em", color:C.muted, textTransform:"uppercase", marginTop:4 }}>{a.name} · 12-lever vector · FY26 trajectory · Monte Carlo n=10,000</div>
              </div>
            </div>
            <div style={{ marginLeft:64, display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { done:true, text:`Loaded analog success patterns: ${a.analog.name}` },
                { done:true, text:"Loaded constraints: $52M marketing budget · 4 FTE account team capacity" },
                { done:true, text:"Loaded competitive context: FedEx 'Auto Express' · 10% USMCA surcharge" },
                { done:false, pulse:true, text:"Optimising lever vector across 3 risk-reward profiles…" },
                { done:false, text:"Projecting Plan-vs-Actual recovery trajectory…" },
                { done:false, text:"Generating timeline of business impact…" },
              ].map((s,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, fontSize:12, color:s.done?C.ink2:C.faint, lineHeight:1.5 }}>
                  <div style={{ width:7, height:7, borderRadius:999, background:s.done?C.green:s.pulse?C.gold:C.line, animation:s.pulse?"pulse 1.5s infinite":"none", flexShrink:0, boxShadow: s.done ? `0 0 0 2px ${C.green}22` : s.pulse ? `0 0 0 2px ${C.gold}22` : "none" }}/>
                  {s.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {simState === "results" && (
          <div>
            <div style={{ background:`${C.gold}06`, border:`1.5px solid ${C.gold}40`, borderRadius:14, padding:"14px 18px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <div style={{ width:6, height:6, borderRadius:999, background:C.green }}/>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", color:C.green, textTransform:"uppercase" }}>Simulation complete · 2.2s · 10,000 runs</span>
                </div>
                <div style={{ fontSize:13, color:C.muted }}>Three optimized lever configurations for {a.name}. Pick one to preview business impact.</div>
              </div>
              <button onClick={() => setSimState("idle")} style={{ fontSize:10, fontWeight:700, color:C.muted, background:"none", border:"none", cursor:"pointer", fontFamily:FONT }}>↻ Re-generate</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14 }}>
              {simOptions.map(opt => {
                const isSel = selectedOptionIdx === opt.id;
                return (
                  <button key={opt.id} onClick={() => { setSelectedOptionIdx(opt.id); setLeverVals({...opt.leverVec}); }}
                    style={{ textAlign:"left", background:isSel?T.cardElevated:C.card, border:`1.5px solid ${isSel?opt.color:C.line}`, borderRadius:T.radLg, padding:"22px 24px", cursor:"pointer", fontFamily:FONT, position:"relative", overflow:"hidden",
                      boxShadow:isSel?T.shadow2:T.shadow1, transition:`all .25s ${T.ease}` }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:opt.color, opacity:isSel?1:.4 }} />
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, marginTop:4 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                          <span style={{ fontSize:9, fontWeight:700, letterSpacing:".22em", color:opt.color, textTransform:"uppercase" }}>Option {String.fromCharCode(65+opt.id)}</span>
                          {opt.id===1 && <span style={{ fontSize:8.5, fontWeight:700, padding:"2px 8px", borderRadius:T.radPill, background:T.goldFoil, color:C.navBg, letterSpacing:".14em", textTransform:"uppercase" }}>AI Pick</span>}
                        </div>
                        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:19, color:C.ink, letterSpacing:"-.005em" }}>{opt.label}</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{opt.tag}</div>
                      </div>
                      <div style={{ width:20, height:20, borderRadius:999, border:`1.5px solid ${isSel?opt.color:C.line2}`, display:"grid", placeItems:"center", flexShrink:0, background:isSel?`${opt.color}10`:"transparent", transition:`all .2s ${T.ease}` }}>
                        {isSel && <div style={{ width:10, height:10, borderRadius:999, background:opt.color }}/>}
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, padding:"14px 0", borderTop:`1px solid ${C.line}`, borderBottom:`1px solid ${C.line}`, marginBottom:14 }}>
                      <div><div style={{ fontSize:8.5, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".18em", marginBottom:4 }}>Revenue Lift</div><div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:opt.color, letterSpacing:"-.02em" }}>+${Math.round(opt.rev)}M</div></div>
                      <div><div style={{ fontSize:8.5, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".18em", marginBottom:4 }}>Win Rate</div><div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:C.ink, letterSpacing:"-.02em" }}>+{opt.winRate.toFixed(1)}pp</div></div>
                      <div><div style={{ fontSize:8.5, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".18em", marginBottom:4 }}>Cycle</div><div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:C.ink2 }}>{Math.round(opt.cycle)}d</div></div>
                      <div><div style={{ fontSize:8.5, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".18em", marginBottom:4 }}>Spend</div><div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:C.ink2 }}>${opt.spend.toFixed(2)}M</div></div>
                    </div>
                    <div style={{ fontSize:8.5, fontWeight:700, color:C.muted, textTransform:"uppercase", marginBottom:6, letterSpacing:".22em" }}>Key Moves</div>
                    {opt.keyMoves.map((m,i) => <div key={i} style={{ fontSize:11.5, color:C.ink2, lineHeight:1.5, marginBottom:4, display:"flex", gap:8, alignItems:"flex-start" }}><span style={{color:opt.color, flexShrink:0, marginTop:1}}>·</span><span>{m}</span></div>)}
                    <div style={{ borderTop:`1px solid ${C.line}`, marginTop:12, paddingTop:10, display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, letterSpacing:".06em" }}>
                      <span>Risk: <strong style={{color:opt.color, letterSpacing:0}}>{opt.risk}</strong></span>
                      <span style={{ fontVariantNumeric:"tabular-nums" }}>{opt.confidence}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 22px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadow2 }}>
              <div>
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase", marginBottom:5 }}>Selected · Ready to Apply</div>
                <div style={{ fontSize:14 }}>
                  <strong style={{ color:simOptions[selectedOptionIdx].color, fontWeight:700 }}>{simOptions[selectedOptionIdx].label}</strong>
                  <span style={{ color:C.faint, margin:"0 8px" }}>·</span>+${Math.round(simOptions[selectedOptionIdx].rev)}M revenue
                  <span style={{ color:C.faint, margin:"0 8px" }}>·</span>+{simOptions[selectedOptionIdx].winRate.toFixed(1)}pp win rate
                </div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Btn kind="ghost" small onClick={() => setSimState("idle")}>← Back to levers</Btn>
                <button onClick={() => { setLeverVals({...simOptions[selectedOptionIdx].leverVec}); setAppliedOption(simOptions[selectedOptionIdx]); setSimState("applied"); setScreen("abm-results"); }}
                  style={{ fontSize:11.5, fontWeight:700, padding:"10px 22px", borderRadius:T.radMd, background:simOptions[selectedOptionIdx].color, color:"#fff", border:"none", cursor:"pointer", fontFamily:FONT, letterSpacing:".08em", textTransform:"uppercase",
                    boxShadow:`0 6px 16px ${simOptions[selectedOptionIdx].color}38`, transition:`transform .15s ${T.ease}` }}>
                  Apply Option {String.fromCharCode(65+selectedOptionIdx)} →
                </button>
              </div>
            </div>

          </div>
        )}
        </>)}

        {onResultsScreen && appliedOption && (() => {
          const liftPerAcct = appliedOption.rev;
          const segmentLift = liftPerAcct + (ABM_BAD_ACCOUNTS.length - 1) * liftPerAcct * 0.55;
          const q3v = 460 + segmentLift * 0.25;
          const q4v = 460 + segmentLift * 0.60;
          const CHART_DATA = [
            {q:"Q3 '24",plan:420,actual:428},{q:"Q4 '24",plan:438,actual:446},{q:"Q1 '25",plan:452,actual:464},{q:"Q2 '25",plan:466,actual:478},
            {q:"Q3 '25",plan:482,actual:490},{q:"Q4 '25",plan:498,actual:478},{q:"Q1 '26",plan:510,actual:468},{q:"Q2 '26",plan:528,actual:460,recovery:460,baseline:460},
            {q:"Q3 '26",plan:544,recovery:Math.round(q3v),baseline:520},{q:"Q4 '26",plan:562,recovery:Math.round(q4v),baseline:548},
          ];
          const TIMELINE = [
            { q:"Jul 26", phase:"Mobilize", impact:"$0M", desc:"Account team activation · Industry Expert engaged", color:C.muted },
            { q:"Aug 26", phase:"Engage", impact:`+$${Math.round(liftPerAcct*0.08)}M`, desc:"NAFA + Auto Logistics Summit · CCO 1-to-1 · NAAF locked", color:C.green },
            { q:"Q3 '26", phase:"First wins", impact:`+$${Math.round(liftPerAcct*0.25)}M`, desc:"Multi-service bundle adopted · Renewal extension on key lanes", color:C.goldDk },
            { q:"Q4 '26", phase:"Compound", impact:`+$${Math.round(liftPerAcct*0.60)}M`, desc:"Peak season capacity guarantee · pilot lane expansion", color:C.goldDk },
            { q:"Q1 '27", phase:"Full impact", impact:`+$${Math.round(liftPerAcct*0.82)}M`, desc:"Wallet headroom captured · SOW lift visible", color:C.green },
          ];

          return (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ background:T.cardElevated, border:`1.5px solid ${appliedOption.color}`, borderRadius:T.radLg, padding:"22px 26px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadow2, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:appliedOption.color }} />
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, marginTop:2 }}>
                    <div style={{ width:8, height:8, borderRadius:999, background:C.green, animation:"pulse 1.5s infinite", boxShadow:`0 0 0 3px ${C.green}22` }}/>
                    <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:appliedOption.color, textTransform:"uppercase" }}>Applied · Option {String.fromCharCode(65+appliedOption.id)} · {appliedOption.label}</span>
                  </div>
                  {/* <div style={{ fontFamily:DISP, fontWeight:600, fontSize:26, color:C.ink, letterSpacing:"-.01em", lineHeight:1.15 }}>Impact on the Automotive number — <span style={{ fontStyle:"italic", color:appliedOption.color }}>visualised</span> below.</div> */}
                  <div style={{ fontSize:13, color:C.muted, marginTop:8, lineHeight:1.5 }}>
                    <strong style={{ color:appliedOption.color, fontWeight:700 }}>+${Math.round(appliedOption.rev)}M</strong> on {a.name} · estimated <strong style={{ color:appliedOption.color, fontWeight:700 }}>+${Math.round(segmentLift)}M</strong> if pattern applied across cluster · {appliedOption.confidence}
                  </div>
                </div>
                <Btn kind="ghost" small onClick={() => { setSimState("results"); setScreen(screen === "abm-results" ? "abm-workbench" : "deal-workbench"); }}>← Change option</Btn>
              </div>

              <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"24px 28px", boxShadow:T.shadow1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                      <span style={{ width:14, height:1, background:T.goldFoil }} />
                      <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Plan vs Actual · Recovery Trajectory</div>
                    </div>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:C.ink, letterSpacing:"-.01em" }}>Q3 '26 → Q4 '26 · with applied option</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>Gold line = actual (reversed). Dashed gold = recovery. Green = baseline recovery.</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:9.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".22em" }}>Gap Closure</div>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:34, color:appliedOption.color, letterSpacing:"-.02em", lineHeight:1.05 }}>{Math.round((segmentLift/112)*100)}%</div>
                    <div style={{ fontSize:10, color:C.faint, letterSpacing:".06em" }}>of $112M YTD gap</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={CHART_DATA} margin={{ top:10, right:30, bottom:5, left:10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line}/>
                    <XAxis dataKey="q" tick={{ fontSize:9, fill:C.muted }} padding={{ left:10, right:10 }}/>
                    <YAxis tick={{ fontSize:10, fill:C.muted }} tickFormatter={v=>`$${v}M`} domain={[400,580]}/>
                    <Line type="monotone" dataKey="plan" name="Plan" stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 3" dot={{ r:2, fill:C.muted }}/>
                    <Line type="monotone" dataKey="actual" name="Actual" stroke={C.gold} strokeWidth={2.5} dot={{ r:3, fill:C.gold }} connectNulls={false}/>
                    <Line type="monotone" dataKey="recovery" name="With applied option" stroke={C.goldDk} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r:4, fill:C.goldDk }} connectNulls={false}/>
                    <Line type="monotone" dataKey="baseline" name="Baseline recovery" stroke={C.green} strokeWidth={1.5} strokeDasharray="2 2" dot={{ r:2, fill:C.green }} connectNulls={false}/>
                    <Tooltip formatter={(v)=>[`$${v}M`]}/>
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", gap:16, marginTop:8, fontSize:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:12, height:2, borderTop:`1.5px dashed ${C.muted}` }}/><span style={{color:C.muted}}>Plan</span></div>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:12, height:2, background:C.gold }}/><span style={{color:C.muted}}>Actual</span></div>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:12, height:2, borderTop:`2px dashed ${C.goldDk}` }}/><span style={{color:C.muted}}>With Option {String.fromCharCode(65+appliedOption.id)}</span></div>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:12, height:2, borderTop:`1.5px dashed ${C.green}` }}/><span style={{color:C.muted}}>Baseline recovery</span></div>
                </div>
              </div>

              <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"24px 28px", boxShadow:T.shadow1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <span style={{ width:14, height:1, background:T.goldFoil }} />
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Timeline · Impact Materialisation</div>
                </div>
                <div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:C.ink, letterSpacing:"-.01em", marginBottom:4 }}>When impact will be visible.</div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:24, lineHeight:1.5 }}>Phased ABM execution — mobilisation → engagement → first wins → compound → full impact.</div>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"absolute", left:20, right:20, top:20, height:2, background:`linear-gradient(90deg, ${C.line} 0%, ${C.goldDk} 50%, ${C.green} 100%)` }}/>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, position:"relative" }}>
                    {TIMELINE.map((m,i) => (
                      <div key={i} style={{ textAlign:"center" }}>
                        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
                          <div style={{ width:40, height:40, borderRadius:999, display:"grid", placeItems:"center", background:C.card, border:`2px solid ${m.color}`, fontSize:11, fontWeight:600, color:m.color, fontFamily:DISP, boxShadow:T.shadow1 }}>{i+1}</div>
                        </div>
                        <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:3 }}>{m.q}</div>
                        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:m.color, marginBottom:3, letterSpacing:"-.005em" }}>{m.phase}</div>
                        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:17, color:m.color, marginBottom:8, letterSpacing:"-.01em" }}>{m.impact}</div>
                        <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{m.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                {[
                  { label:`${a.name} · FY26 lift`, val:`+$${Math.round(appliedOption.rev)}M`, sub:`From $${a.actualRev}M → $${a.actualRev+Math.round(appliedOption.rev)}M` },
                  { label:"Auto segment · if scaled", val:`+$${Math.round(segmentLift)}M`, sub:`${Math.round((segmentLift/112)*100)}% of YTD gap recovered` },
                  { label:"Win rate uplift", val:`+${appliedOption.winRate.toFixed(1)}pp`, sub:`Cycle ${Math.round(appliedOption.cycle)}d` },
                  { label:"Marketing investment", val:`$${appliedOption.spend.toFixed(2)}M`, sub:`ROI ~${(appliedOption.rev/appliedOption.spend).toFixed(1)}×` },
                ].map((m,i) => (
                  <div key={i} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1, position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:appliedOption.color, opacity:.55 }} />
                    <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, marginBottom:8, textTransform:"uppercase", marginTop:2 }}>{m.label}</div>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:26, color:appliedOption.color, letterSpacing:"-.02em", lineHeight:1.05 }}>{m.val}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{m.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:T.cardElevated, border:`1px solid ${C.gold}44`, borderRadius:T.radLg, padding:"22px 26px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadowGoldGlow, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil }} />
                <div>
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase", marginBottom:4 }}>Ready to Commit</div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:C.ink, letterSpacing:"-.005em" }}>Save as tracked initiative, then push to field for execution.</div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <Btn kind="ghost" small disabled={savingInitiative} onClick={async () => {
                    setSavingInitiative(true);
                    try {
                      await saveSimulationAsMemory({
                        simulation_title: `${a.name} — ${appliedOption.label}`,
                        simulation_summary: `Applied Option ${String.fromCharCode(65+appliedOption.id)}: +$${Math.round(appliedOption.rev)}M revenue, +${appliedOption.winRate.toFixed(1)}pp win rate, ${Math.round(appliedOption.cycle)}d cycle. Spend: $${appliedOption.spend.toFixed(2)}M. Key moves: ${appliedOption.keyMoves.join("; ")}. ${appliedOption.confidence}.`,
                        simulation_type: "abm",
                        query: `ABM simulation for ${a.name}`,
                        levers: appliedOption.keyMoves,
                        metrics: [
                          { label: "Revenue Lift", value: `+$${Math.round(appliedOption.rev)}M` },
                          { label: "Win Rate", value: `+${appliedOption.winRate.toFixed(1)}pp` },
                          { label: "Cycle", value: `${Math.round(appliedOption.cycle)}d` },
                          { label: "Spend", value: `$${appliedOption.spend.toFixed(2)}M` },
                        ],
                        recommendations: appliedOption.keyMoves,
                      });
                      toast.push({ tone:"success", title:"Saved to Memory", body:`${a.name} · ${appliedOption.label} saved as in-motion initiative in Memory.` });
                    } catch (e) {
                      toast.push({ tone:"error", title:"Save failed", body: e.message });
                    } finally {
                      setSavingInitiative(false);
                    }
                  }}>{savingInitiative ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> Saving...</> : "Save as initiative"}</Btn>
                  {onCreateBrief && <Btn kind="gold" onClick={() => onCreateBrief({
                    context_type: "simulation",
                    context_data: {
                      verdict: `${a.name} — ${appliedOption.label}: +$${Math.round(appliedOption.rev)}M revenue, +${appliedOption.winRate.toFixed(1)}pp win rate, ${Math.round(appliedOption.cycle)}d cycle. Spend: $${appliedOption.spend.toFixed(2)}M. ${appliedOption.confidence}.`,
                      key_metrics: [{ label: "Revenue Lift", value: `+$${Math.round(appliedOption.rev)}M` }, { label: "Win Rate", value: `+${appliedOption.winRate.toFixed(1)}pp` }, { label: "Cycle", value: `${Math.round(appliedOption.cycle)}d` }, { label: "Spend", value: `$${appliedOption.spend.toFixed(2)}M` }],
                      recommendations: appliedOption.keyMoves,
                      query: `ABM simulation for ${a.name}`,
                      levers: appliedOption.keyMoves,
                    },
                    pushMembers: [
                      { name: "VP Automotive Sales", role: "K. Tate (account ownership for T1 OEMs)" },
                      { name: "VP Revenue Management", role: "R. Patel (pricing lever authority)" },
                      { name: "Head of ABM", role: "Marketing lead for Automotive segment campaigns" },
                      { name: "Industry Expert, Automotive", role: "Detroit-based field specialist" },
                      { name: "UPS Capital", role: "Trade-finance attach for Aptiv and Stellantis plays" },
                    ],
                  })}><FileEdit size={13} /> Create Alignment Brief</Btn>}
                  {/* <Btn kind="ghost" onClick={() => setScreen("initiatives")}>View all initiatives →</Btn> */}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Push to Subordinate Modal */}
        {showPushModal && appliedOption && (() => {
          const pushMembers = [
            { name: "VP Automotive Sales", role: "K. Tate (account ownership for T1 OEMs)" },
            { name: "VP Revenue Management", role: "R. Patel (pricing lever authority)" },
            { name: "Head of ABM", role: "Marketing lead for Automotive segment campaigns" },
            { name: "Industry Expert, Automotive", role: "Detroit-based field specialist" },
            { name: "UPS Capital", role: "Trade-finance attach for Aptiv and Stellantis plays" },
          ];
          const pushCount = pushChecked.filter(Boolean).length;
          return (
          <div style={{ position:"fixed", inset:0, zIndex:9999, display:"grid", placeItems:"center", background:"rgba(10,22,40,.55)", backdropFilter:"blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowPushModal(false); }}>
            <style>{`
              .push-modal-scroll::-webkit-scrollbar { width: 5px; }
              .push-modal-scroll::-webkit-scrollbar-track { background: transparent; }
              .push-modal-scroll::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 10px; }
              .push-modal-scroll::-webkit-scrollbar-thumb:hover { background: ${C.muted}; }
            `}</style>
            <div className="push-modal-scroll" style={{ background:C.card, borderRadius:T.radLg, padding:"32px 36px", maxWidth:640, width:"90%", boxShadow:"0 24px 64px rgba(0,0,0,.25)", position:"relative", maxHeight:"85vh", overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:`${C.line} transparent` }}>
              <button onClick={() => setShowPushModal(false)} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:18 }}>✕</button>

              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ width:18, height:1, background:T.goldFoil }} />
                <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Route to Execution</span>
              </div>
              <div style={{ fontFamily:DISP, fontWeight:600, fontSize:24, color:C.ink, letterSpacing:"-.02em", lineHeight:1.15, marginBottom:4 }}>
                Invite team to investigate — Working Group
              </div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:24, lineHeight:1.5 }}>
                Automotive Account Growth Recovery
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div>
                  <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", marginBottom:14 }}>Who to Include ({pushCount})</div>
                  {pushMembers.map((mem, mi) => (
                    <div key={mi} onClick={() => { const next = [...pushChecked]; next[mi] = !next[mi]; setPushChecked(next); }}
                      style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", marginBottom:6, cursor:"pointer",
                      background: pushChecked[mi] ? `${C.gold}08` : "transparent", border:`1px solid ${pushChecked[mi] ? C.gold+"50" : C.line}`, borderRadius:T.radMd,
                      transition:`all .15s ${T.ease}` }}>
                      <input type="checkbox" checked={pushChecked[mi]} readOnly style={{ marginTop:2, accentColor:C.gold, width:15, height:15, cursor:"pointer" }} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color: pushChecked[mi] ? C.ink : C.muted, lineHeight:1.3 }}>{mem.name}</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:2, lineHeight:1.4 }}>{mem.role}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", marginBottom:14 }}>Share Preview</div>
                  <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"16px 18px", marginBottom:16 }}>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:C.ink, marginBottom:8 }}>Automotive Segment: 5 Accounts Below Plan. Drive Proactive Retention through Account Based Marketing (ABM) Intervention</div>
                    <div style={{ fontSize:12, color:C.ink2, lineHeight:1.6, marginBottom:10 }}>
                      5 strategic auto accounts · $116M below plan · 2 renewal windows
                    </div>
                    {[
                      { label: "Auto Revenue YTD", val: "$1.84B", neg: false },
                      { label: "Auto ADV Growth", val: "+4.1%", neg: false },
                      { label: "Auto Op. Margin", val: "9.2%", neg: false },
                    ].map((k, ki) => (
                      <div key={ki} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderTop:`1px solid ${C.line}` }}>
                        <span style={{ fontSize:11, color:C.muted }}>{k.label}</span>
                        <span style={{ fontSize:12, fontWeight:600, color: k.neg ? C.red : C.ink, fontFamily:DISP }}>{k.val}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Key Supporting Questions</div>
                  {[
                    "Can the GM ABM playbook (CCO briefings + Industry Expert + NAAF lock) be replicated at Ford and Stellantis before August renewal windows close?",
                    "What is the current state of UPS executive-level relationships at each of the 5 declining accounts?",
                  ].map((q, qi) => (
                    <div key={qi} style={{ fontSize:12, color:C.ink2, lineHeight:1.5, padding:"8px 0", borderBottom:`1px solid ${C.line}08`, display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ color:C.gold, flexShrink:0, marginTop:2 }}>?</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop:24, display:"flex", justifyContent:"center" }}>
                {pushSent ? (
                  <div style={{ background:`${C.green}0C`, border:`1px solid ${C.green}40`, borderRadius:T.radLg, padding:"20px 24px", display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>
                    <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.green, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Execution Brief Sent</div>
                    <div style={{ fontSize:13, color:C.ink, fontWeight:600, marginBottom:6 }}>Routed to {pushCount} team member{pushCount !== 1 ? "s" : ""} for field execution.</div>
                    <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>They'll receive the full ABM lever configuration, projected outcomes, and execution questions.</div>
                  </div>
                ) : (
                  <button onClick={() => setPushSent(true)} disabled={pushCount === 0}
                    style={{ padding:"10px 22px", borderRadius:T.radPill, background: pushCount > 0 ? T.goldFoil : C.line, color: pushCount > 0 ? "#0A1628" : C.muted, border:"none", cursor: pushCount > 0 ? "pointer" : "not-allowed",
                      fontFamily:FONT, fontWeight:700, fontSize:11.5, letterSpacing:".05em", textTransform:"uppercase",
                      boxShadow: pushCount > 0 ? T.shadowGoldGlow : "none", transition:`all .15s ${T.ease}`, display:"flex", alignItems:"center", gap:7 }}
                    onMouseEnter={e => { if (pushCount > 0) e.currentTarget.style.transform = "scale(1.02)"; }}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                    Push to Field Team ({pushCount})
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    );
  };

  /* ---- SCREEN: INITIATIVES & DECISIONS LOG ---- */
  const renderInitiatives = () => {
    const [iniFilter, setIniFilter] = useState("all");
    const filtered = iniFilter === "all" ? ABM_INITIATIVES : ABM_INITIATIVES.filter(i => i.status === iniFilter);
    const completedCount = ABM_INITIATIVES.filter(i => i.status === "completed").length;
    const activeCount = ABM_INITIATIVES.filter(i => i.status === "in-execution").length;
    const totalModeled = ABM_INITIATIVES.reduce((s,i) => s + i.modeledRev, 0);
    const totalActual = ABM_INITIATIVES.reduce((s,i) => s + i.actualRev, 0);

    return (
      <div>
        {/* <Breadcrumb items={[{label:"Executive Home", onClick:onBack},{label:"Automotive Segment Growth", onClick:()=>setScreen("biz-snapshot")},{label:"Initiatives & Decisions Log"}]} /> */}

        <SH kicker="Objective I · Decision history · Learning fuel"
          title="What you've done. What it produced."
          sub="Every saved experiment becomes an initiative routed to a subordinate for execution. Past initiatives feed forward — modeled vs actual variance teaches the simulation engine and gives Matt better priors on the next experiment."
          right={<div style={{display:"flex",gap:6}}><TagChip tone="green">{completedCount} completed</TagChip><TagChip tone="amber">{activeCount} in execution</TagChip></div>} />

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
          <KCard label="Initiatives launched · 24mo" value={String(ABM_INITIATIVES.length)} delta="" deltaLabel="across 4 strategic accounts" status="ok" sub="Auto segment scope" />
          <KCard label="Aggregate modeled revenue lift" value={`$${totalModeled}M`} delta="" deltaLabel="across all initiatives" status="ok" sub="Combined ABM impact" />
          <KCard label="Aggregate actual revenue lift" value={`$${totalActual}M`} delta={`${totalActual >= totalModeled ? "+" : ""}${totalActual - totalModeled}M`} deltaLabel={totalActual >= totalModeled ? "above modeled" : "below modeled"} status={totalActual >= totalModeled ? "ok" : "warn"} sub="Engine calibration signal" />
          <KCard label="Realization · actual / modeled" value={`${Math.round((totalActual/totalModeled)*100)}%`} delta="" deltaLabel="trailing 24mo" status={(totalActual/totalModeled) >= 0.95 ? "ok" : "warn"} sub="Higher = engine well-calibrated" />
        </div>

        <div style={{ display:"flex", gap:6, marginBottom:18 }}>
          {[{k:"all",l:"All"},{k:"completed",l:"Completed"},{k:"in-execution",l:"In execution"}].map(f => (
            <button key={f.k} onClick={() => setIniFilter(f.k)}
              style={{ fontSize:11, fontWeight:iniFilter===f.k?700:500, padding:"7px 14px", borderRadius:T.radPill, border:`1px solid ${iniFilter===f.k?C.gold:C.line}`, background:iniFilter===f.k?`${C.gold}10`:C.card, color:iniFilter===f.k?C.goldDk:C.muted, cursor:"pointer", fontFamily:FONT, letterSpacing:".06em" }}>
              {f.l}
            </button>
          ))}
          <div style={{ marginLeft:"auto", fontSize:10, color:C.faint }}>Showing {filtered.length} of {ABM_INITIATIVES.length}</div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:24 }}>
          {filtered.map(ini => {
            const isCompleted = ini.status === "completed";
            const outcomeVariance = ini.actualRev - ini.modeledRev;
            const outcomeColor = outcomeVariance >= 0 ? C.green : C.amber;
            return (
              <div key={ini.id} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 24px", boxShadow:T.shadow1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <TagChip tone={isCompleted?"green":"amber"}>{isCompleted?"Completed":"In execution"}</TagChip>
                      <span style={{ fontSize:10, color:C.faint, letterSpacing:".06em" }}>{ini.id}</span>
                      <span style={{ fontSize:10, color:C.faint }}>·</span>
                      <span style={{ fontSize:10, color:C.muted }}>{ini.account}</span>
                    </div>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:C.ink, letterSpacing:"-.01em", marginBottom:6, lineHeight:1.2 }}>{ini.name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>Owner: {ini.owner}</div>
                    <div style={{ fontSize:10, color:C.faint, marginTop:3, letterSpacing:".04em" }}>{ini.createdDate} → {ini.endDate} · {ini.stage}</div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, textAlign:"right", flexShrink:0 }}>
                    <div>
                      <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>Modeled rev lift</div>
                      <div style={{ fontFamily:DISP, fontWeight:600, fontSize:18, color:C.ink }}>${ini.modeledRev}M</div>
                      <div style={{ fontSize:9, color:C.faint, marginTop:3 }}>+{ini.modeledWinRate}pp win</div>
                    </div>
                    <div>
                      <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>{isCompleted?"Actual rev lift":"Actual (so far)"}</div>
                      <div style={{ fontFamily:DISP, fontWeight:600, fontSize:18, color:outcomeColor }}>${ini.actualRev}M</div>
                      <div style={{ fontSize:9, color:outcomeColor, marginTop:3 }}>+{ini.actualWinRate}pp win</div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop:`1px solid ${C.line}`, paddingTop:14, display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.faint, textTransform:"uppercase", marginBottom:6 }}>Levers deployed</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {ini.levers.map((l,j) => <TagChip key={j}>{l}</TagChip>)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.faint, textTransform:"uppercase", marginBottom:6 }}>Notes</div>
                    <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{ini.notes}</div>
                  </div>
                </div>

                {(ini.whatWorked || ini.whatDidntWork || ini.lessonLearned) && (
                  <div style={{ borderTop:`1px solid ${C.line}`, paddingTop:14, marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                    <div style={{ background:`${C.green}06`, border:`1px solid ${C.green}25`, borderRadius:T.radMd, padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                        <span style={{ color:C.green }}>✓</span>
                        <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.green, textTransform:"uppercase" }}>What worked</div>
                      </div>
                      <div style={{ fontSize:11, color:C.ink2, lineHeight:1.5 }}>{ini.whatWorked}</div>
                    </div>
                    <div style={{ background:`${C.amber}06`, border:`1px solid ${C.amber}25`, borderRadius:T.radMd, padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                        <span style={{ color:C.amber }}>✕</span>
                        <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.amber, textTransform:"uppercase" }}>What didn't work</div>
                      </div>
                      <div style={{ fontSize:11, color:C.ink2, lineHeight:1.5 }}>{ini.whatDidntWork}</div>
                    </div>
                    <div style={{ background:`${C.gold}06`, border:`1px solid ${C.gold}25`, borderRadius:T.radMd, padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                        <span style={{ color:C.goldDk }}>★</span>
                        <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.goldDk, textTransform:"uppercase" }}>For next time</div>
                      </div>
                      <div style={{ fontSize:11, color:C.ink2, lineHeight:1.5 }}>{ini.lessonLearned}</div>
                    </div>
                  </div>
                )}

                {!isCompleted && (
                  <div style={{ borderTop:`1px solid ${C.line}`, paddingTop:14, marginTop:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:11, color:C.muted }}>
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.faint, textTransform:"uppercase", marginRight:8 }}>Implementation</span>
                      {ini.stage}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn kind="ghost" small onClick={() => toast.push({ tone:"stub", title:"Check in with owner", body:`Would send a check-in request to ${ini.owner}.`, note:"Yet to integrate." })}>Check in with owner</Btn>
                      <Btn kind="ghost" small onClick={() => toast.push({ tone:"stub", title:"View details", body:`Would open full detail view for ${ini.id}.`, note:"Yet to integrate." })}>View details</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ background:`${C.gold}06`, border:`1.5px solid ${C.gold}25`, borderRadius:T.radLg, padding:"22px 26px" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase", marginBottom:8 }}>What the data says</div>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, margin:0 }}>
            Across the 4 initiatives, industry-event-led plays (Magna) outperformed model by 17%; production-cadence-aligned plays (Toyota) underperformed by 12% due to longer cycle times; cross-sell ABM (Aptiv) traction is slower than modeled. <span style={{ color:C.goldDk, fontWeight:600 }}>Lesson for the next experiment</span>: weight industry-event channels higher for Stellantis (analog: Magna); expect 4–5 quarter cycle for Tesla (greenfield analog: Rivian).
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      {onBack && (
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:C.brandLt, fontSize:13, fontWeight:600, fontFamily:FONT }}>
            <ChevronLeft size={16}/> Decision Lab
          </button>
          <span style={{ color:C.faint, fontSize:12 }}>/</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>Automotive Segment Growth</span>
        </div>
      )}
      {/* 3-step stepper */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, marginBottom:32, background:C.card, border:`1px solid ${C.line}`, borderRadius:14, padding:"18px 28px", boxShadow:"0 2px 8px rgba(40,22,12,.06)" }}>
        {[
          { key:"biz-snapshot", num:1, label:"Business Snapshot", icon:Eye },
          { key:"account-recs", num:2, label:"Account Intelligence", icon:Target },
          { key:"abm-workbench", num:3, label:"ABM Workbench", icon:Activity },
          { key:"abm-results", num:4, label:"Outcomes", icon:BarChart3 },
        ].map((s, i, arr) => {
          const screenOrder = ["biz-snapshot","account-recs","abm-workbench","abm-results"];
          const curIdx = screenOrder.indexOf(screen);
          const sIdx = screenOrder.indexOf(s.key);
          const done = sIdx < curIdx;
          const active = s.key === screen;
          const Icon = s.icon;
          return (
            <React.Fragment key={s.key}>
              {i > 0 && <div style={{ width:56, height:2, background:done?C.green:active?C.gold:C.line, margin:"0 4px", borderRadius:2, transition:"background 0.3s" }}/>}
              <button onClick={() => setScreen(s.key)}
                style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 18px", borderRadius:10, border:active?`2px solid ${C.gold}`:done?`2px solid ${C.green}44`:`2px solid transparent`, background:active?C.amberBg:done?C.greenBg:"transparent", cursor:"pointer", fontFamily:FONT, transition:"all 0.25s" }}>
                <div style={{ width:32, height:32, borderRadius:999, flexShrink:0, background:done?C.green:active?C.gold:C.line, display:"grid", placeItems:"center", transition:"background 0.3s" }}>
                  {done ? <Check size={16} color="#fff" strokeWidth={3}/> : <Icon size={15} color={active?C.brand:C.faint}/>}
                </div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:10, letterSpacing:".08em", color:done?C.green:active?C.goldDk:C.faint, fontWeight:700 }}>STEP {s.num}</div>
                  <div style={{ fontSize:13, fontWeight:active?700:500, color:active?C.ink:done?C.ink2:C.muted, whiteSpace:"nowrap" }}>{s.label}</div>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {screen === "biz-snapshot" && renderBizSnapshot()}
      {screen === "account-recs" && renderAccountRecs()}
      {(screen === "abm-workbench" || screen === "abm-results") && renderWorkbench()}
      {screen === "initiatives" && renderInitiatives()}
    </div>
  );
}

/* ------------------------------------------------------------------ ENTERPRISE DEEP VIEW · Objective 2 · Digital Deal Analyser */
function EnterpriseDeepView({ onBack, onCreateBrief }) {
  const toast = useToast();
  const [screen, setScreen] = useState("ent-snapshot"); // ent-snapshot | da-snapshot | deal-workbench | results
  const [snapshot, setSnapshot] = useState(null);
  const [daOverview, setDaOverview] = useState(null);
  const [leverDefs, setLeverDefs] = useState([]);
  const [leverVals, setLeverVals] = useState({});
  const [expandedPacket, setExpandedPacket] = useState(10941); // pre-expand AutoZone
  const [packetFilter, setPacketFilter] = useState("All");
  const [simState, setSimState] = useState("idle");
  const [simResult, setSimResult] = useState(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(1);
  const [appliedOption, setAppliedOption] = useState(null);
  const [savingEntInitiative, setSavingEntInitiative] = useState(false);
  const [showEntPushModal, setShowEntPushModal] = useState(false);
  const [entPushSent, setEntPushSent] = useState(false);
  const [entPushChecked, setEntPushChecked] = useState([true,true,true,true,true]);

  React.useEffect(() => {
    fetchEntSnapshot().then(setSnapshot).catch(console.error);
    fetchDAOverview().then(setDaOverview).catch(console.error);
    fetchDealLevers().then(defs => {
      setLeverDefs(defs);
      const init = {};
      defs.forEach(d => { init[d.lever_key] = d.default_val; });
      setLeverVals(init);
    }).catch(console.error);
  }, []);

  const [resetFlash, setResetFlash] = useState(null);

  const ASIS_LEVERS = { l2Ceiling:1, l0Floor:150, l1AccCeiling:20, l4ZoneMin:1, scenarioRigor:3, seniorAnalyst:20, macroPosture:1 };
  const REC_LEVERS = { l2Ceiling:3, l0Floor:200, l1AccCeiling:18, l4ZoneMin:2, scenarioRigor:4, seniorAnalyst:28, macroPosture:0 };

  const setLever = (key, val) => {
    setLeverVals(prev => ({ ...prev, [key]: val }));
    if (simState === "results" || simState === "applied") { setSimState("idle"); setSimResult(null); setAppliedOption(null); }
  };
  const resetToAsIs = () => {
    setLeverVals({ ...ASIS_LEVERS });
    setSimState("idle"); setSimResult(null); setAppliedOption(null);
    setResetFlash("asis"); setTimeout(() => setResetFlash(null), 1800);
  };
  const resetToRecommended = () => {
    setLeverVals({ ...REC_LEVERS });
    setSimState("idle"); setSimResult(null); setAppliedOption(null);
    setResetFlash("rec"); setTimeout(() => setResetFlash(null), 1800);
  };
  const stagedCount = leverDefs.filter(d => leverVals[d.lever_key] !== ASIS_LEVERS[d.lever_key]).length;

  const asIsOutcomes = (() => {
    const l = ASIS_LEVERS;
    return { rev:9420, margin:6.2, leakage:46, realization:84, winRate:68, modeledProfit:810 };
  })();

  const fmtDealLeverVal = (meta, val) => {
    if (meta.options) return meta.options[val] || String(val);
    return `${val}${meta.unit || ""}`;
  };

  const colorMap = { gold: C.gold, goldDk: C.goldDk, green: C.green, blue: C.brandLt, brick: C.red, amber: C.amber, muted: C.muted };
  const resolveColor = k => colorMap[k] || C.muted;

  const runSimulation = async () => {
    setSimState("running");
    try {
      const result = await simulateDealWorkbench(leverVals);
      setTimeout(() => { setSimResult(result); setSimState("results"); }, 2200);
    } catch (e) {
      console.error(e);
      setTimeout(() => setSimState("idle"), 1500);
    }
  };

  const applyOption = (opt) => { setAppliedOption(opt); setSimState("applied"); setScreen("results"); };

  const saveInitiative = async (status) => {
    if (!appliedOption) return;
    try {
      const payload = {
        name: `Guardrail directive · Option ${String.fromCharCode(65 + appliedOption.id)} · ${appliedOption.label}`,
        scope: "Portfolio · Enterprise pricing guardrails",
        status: status,
        stage: status === "pending-approval" ? "Routed for committee sign-off" : "Saved as draft",
        owner: "M. Guffey (CCO)",
        modeled_profit: appliedOption.profit_lift,
        actual_profit: 0,
        modeled_margin: appliedOption.margin_lift_bps / 100,
        actual_margin: 0,
        notes: `${appliedOption.tag}. Key moves: ${appliedOption.key_moves.join("; ")}. ${appliedOption.confidence}.`,
        levers: appliedOption.key_moves,
        affected_packets: appliedOption.affected_packets,
      };
      const created = await createEntInitiative(payload);
      const t = status === "pending-approval"
        ? { tone:"success", title:"Routed for sign-off", body:`${payload.name} sent to ${["CFO","Pricing Committee"].join(" + ")}. Tracked in History.`, note:"Initiative status: pending-approval" }
        : status === "in-execution"
        ? { tone:"success", title:"Initiative saved", body:`${payload.name} active in History → Saved from Decision Lab.` }
        : { tone:"success", title:"Saved as draft", body:`${payload.name} stored in History.` };
      toast.push(t);
    } catch (e) { console.error(e); toast.push({ tone:"error", title:"Save failed", body:String(e.message || e) }); }
  };

  // ---- BREADCRUMB ----
  const Breadcrumb = ({ items }) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16, fontSize:10, fontWeight:700, letterSpacing:".22em", textTransform:"uppercase", color:C.faint }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color:C.faint, fontWeight:400 }}>›</span>}
          {it.onClick ? <button onClick={it.onClick} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:10, fontWeight:700, letterSpacing:".22em", textTransform:"uppercase", color:C.muted, padding:0, transition:`color .15s ${T.ease}` }}
            onMouseEnter={e => e.currentTarget.style.color = C.ink}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}>{it.label}</button>
            : <span style={{ color:C.goldDk }}>{it.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );

  if (!snapshot || !daOverview) return (
    <div style={{ textAlign:"center", padding:60, color:C.muted, fontSize:13 }}>Loading Objective II…</div>
  );

  // ============================================================
  // SCREEN 1 · ENTERPRISE BUSINESS SNAPSHOT
  // ============================================================
  const renderEntSnapshot = () => {
    const wsAgg = {
      Renewal: snapshot.strategic_deals.filter(d => d.workstream === "Renewal"),
      Retention: snapshot.strategic_deals.filter(d => d.workstream === "Retention"),
      Penetration: snapshot.strategic_deals.filter(d => d.workstream === "Penetration"),
      "New Logo": snapshot.strategic_deals.filter(d => d.workstream === "New Logo"),
    };
    const wsConfig = [
      { k:"Renewal", label:"Renewals", color:C.gold, sub:"Existing contracts up for term renewal" },
      { k:"Retention", label:"Retention saves", color:C.red, sub:"Save-plays in motion" },
      { k:"Penetration", label:"Penetration", color:C.green, sub:"Cross-sell · up-sell" },
      { k:"New Logo", label:"New Logo", color:C.brandLt, sub:"Net-new accounts + lanes" },
    ];

    return (
      <div>
        {/* <Breadcrumb items={[
          {label:"Executive Home", onClick:onBack},
          {label:"Decision Lab", onClick:onBack},
          {label:"Objective II"},
          {label:"Enterprise Business Snapshot"},
        ]} /> */}

        <SH kicker="Enterprise segment"
          title="Win rate, revenue, margin — the deal-machine view."
          sub="Q1 print: RPP +6.5%, but margin pressure 250 bps from short-term costs. Pricing power exists. Margin realization is the lever. Eight strategic parent deals in flight across Renewals, Retention, Penetration, New Logo — one needs your override today."
          right={<div style={{display:"flex",gap:6}}><TagChip tone="brick">1 action required</TagChip><TagChip tone="gold">{snapshot.strategic_deals.length} strategic deals</TagChip></div>}
        />

        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:26 }}>
          {snapshot.kpis.map(k => (
            <KCard key={k.id} label={k.label} value={k.value} delta={k.delta} deltaLabel={k.delta_label} status={k.status} sub={k.sub} />
          ))}
        </div>

        {/* Plan vs Actual Margin Chart */}
        <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 26px", marginBottom:24, boxShadow:T.shadow1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ width:14, height:1, background:T.goldFoil }} />
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Plan vs Actual · Enterprise Op Margin · 8Q + forward</div>
              </div>
              <div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:C.ink, letterSpacing:"-.01em" }}>The margin pressure is visible — and recoverable.</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>Q1 '26 dipped to 4.0% on short-term cost rebuild. FY guide 7.5–8.5%. Modeled recovery on dashed line — tightens L1 accessorial + L2 ceiling discipline.</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={snapshot.margin_trajectory.map(m => ({ q:m.quarter, plan:m.plan_margin, actual:m.actual_margin, recovery:m.recovery_margin }))} margin={{ top:10, right:30, bottom:5, left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line}/>
              <XAxis dataKey="q" tick={{ fontSize:10, fill:C.muted }} padding={{ left:10, right:10 }}/>
              <YAxis tick={{ fontSize:10, fill:C.muted }} tickFormatter={v=>`${v}%`} domain={[3, 9]}/>
              <Line type="monotone" dataKey="plan" name="Plan" stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 3" dot={{ r:3, fill:C.muted }}/>
              <Line type="monotone" dataKey="actual" name="Actual" stroke={C.gold} strokeWidth={2.5} dot={{ r:4, fill:C.gold }} connectNulls={false}/>
              <Line type="monotone" dataKey="recovery" name="If recovered" stroke={C.green} strokeWidth={2} strokeDasharray="2 2" dot={{ r:3, fill:C.green }} connectNulls={false}/>
              <Tooltip formatter={(v)=>v ? [`${v}%`]:["—"]} contentStyle={{ borderRadius:T.radSm, border:`1px solid ${C.line2}`, fontSize:12 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Causal: Market signals → deal effects */}
        <SH kicker="Causal · market signals → ongoing deals"
          title="How today's signals are bending deal economics."
          sub={`${snapshot.signal_effects.length} live signals · each linked to a specific Analyser Packet in flight.`} />

        <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, marginBottom:32, overflow:"hidden", boxShadow:T.shadow1 }}>
          <div style={{ overflowX:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"32px 2.5fr 1.5fr 3fr 100px 100px", padding:"12px 18px", borderBottom:`1px solid ${C.line}`, fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", columnGap:10, minWidth:800 }}>
            <div></div><div>Signal</div><div>Linked Packet</div><div>Causal effect</div><div style={{ textAlign:"right" }}>Δ $</div><div></div>
          </div>
          {snapshot.signal_effects.map(s => (
            <div key={s.id} style={{ display:"grid", gridTemplateColumns:"32px 2.5fr 1.5fr 3fr 100px 100px", padding:"14px 18px", borderBottom:`1px solid ${C.line}`, fontSize:12, alignItems:"center", transition:`background .15s ${T.ease}`, columnGap:10, minWidth:800 }}
              onMouseEnter={e => e.currentTarget.style.background = `${C.gold}05`}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div><span style={{ width:7, height:7, borderRadius:"50%", background:s.dot==="red"?C.red:C.amber, display:"inline-block", animation:s.dot==="red"?"pulse 1.5s infinite":"none" }}/></div>
              <div>
                <span style={{ fontSize:8.5, fontWeight:700, padding:"2px 7px", borderRadius:T.radSm, background:C.line, color:C.muted, letterSpacing:".14em", textTransform:"uppercase", marginRight:8 }}>{s.sig_type}</span>
                <span style={{ fontSize:12, color:C.ink }}>{s.title}</span>
              </div>
              <div style={{ fontSize:10.5, color:C.ink2, fontFamily:FONT }}>{s.linked_packets}</div>
              <div style={{ fontSize:11, color:C.muted, lineHeight:1.45 }}>{s.effect}</div>
              <div style={{ textAlign:"right", fontFamily:DISP, fontWeight:600, fontSize:14, color:s.color==="brick"?C.red:C.goldDk }}>{s.dollar}</div>
              <div style={{ textAlign:"right" }}>
                <button onClick={() => setScreen("da-snapshot")} style={{ fontSize:9.5, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:C.green, background:"none", border:"none", cursor:"pointer", fontFamily:FONT }}>DA →</button>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Workstream summary cards */}
        <SH kicker="Strategic parent deals · in-flight pulse"
          title="Top ongoing deals by workstream."
          sub="Renewals · Retention · Penetration · New Logo. Each row links to its Analyser Packet." />

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:18 }}>
          {wsConfig.map(ws => {
            const deals = wsAgg[ws.k] || [];
            const total = deals.reduce((s,d)=>s+d.value, 0);
            const hasDeviation = deals.some(d => d.playbook === "deviating");
            return (
              <button key={ws.k} onClick={() => setScreen("da-snapshot")}
                style={{ textAlign:"left", background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", cursor:"pointer", fontFamily:FONT, boxShadow:T.shadow1, position:"relative", overflow:"hidden", transition:`transform .2s ${T.ease}, box-shadow .2s ${T.ease}` }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadow2; }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow = T.shadow1; }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:ws.color }} />
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:ws.color, textTransform:"uppercase", marginBottom:8, marginTop:2 }}>{ws.label}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:6 }}>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:26, color:C.ink, letterSpacing:"-.02em" }}>${total}M</div>
                  <div style={{ fontSize:10, color:C.muted }}>· {deals.length} deals</div>
                </div>
                <div style={{ fontSize:11, color:C.muted, lineHeight:1.4 }}>{ws.sub}</div>
                {hasDeviation && <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6, fontSize:10, fontWeight:700, color:C.red }}><span style={{width:6,height:6,borderRadius:999,background:C.red, animation:"pulse 1.5s infinite"}}/>1 deviation</div>}
              </button>
            );
          })}
        </div>

        {/* Strategic deals table */}
        <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, marginBottom:24, overflow:"hidden", boxShadow:T.shadow1 }}>
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase" }}>Live deals · strategic parents · all workstreams</div>
            <div style={{ fontSize:10, color:C.faint, letterSpacing:".06em" }}>Each row deep-links to its Analyser Packet</div>
          </div>
          <div style={{ overflowX:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"32px minmax(160px,2fr) minmax(100px,1fr) 90px minmax(130px,1.5fr) 70px 70px minmax(100px,1fr) minmax(120px,1.2fr) 36px", padding:"10px 18px", borderBottom:`1px solid ${C.line}`, fontSize:9.5, fontWeight:700, letterSpacing:".14em", color:C.muted, textTransform:"uppercase", columnGap:10, minWidth:950 }}>
            <div></div><div>Customer · Packet</div><div>Workstream</div><div style={{textAlign:"right"}}>Bid value</div><div>Stage</div><div style={{textAlign:"right"}}>Mod OR</div><div style={{textAlign:"right"}}>Margin</div><div>Playbook</div><div>Owner</div><div></div>
          </div>
          {snapshot.strategic_deals.map(d => {
            const urgentColor = d.urgency==="high"?C.red:d.urgency==="med"?C.amber:C.green;
            const pbColor = d.playbook==="on-track"?C.green:d.playbook==="watch"?C.amber:C.red;
            const pbLabel = d.playbook==="on-track"?"On track":d.playbook==="watch"?"Watch":"Deviating";
            return (
              <div key={d.id} style={{ display:"grid", gridTemplateColumns:"32px minmax(160px,2fr) minmax(100px,1fr) 90px minmax(130px,1.5fr) 70px 70px minmax(100px,1fr) minmax(120px,1.2fr) 36px", padding:"12px 18px", borderBottom:`1px solid ${C.line}`, fontSize:12, alignItems:"center", transition:`background .15s ${T.ease}`, cursor:"pointer", columnGap:10, minWidth:950 }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.gold}06`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                onClick={() => setScreen("da-snapshot")}>
                <div><span style={{ width:7, height:7, borderRadius:"50%", background:urgentColor, display:"inline-block", animation:d.urgency==="high"?"pulse 1.5s infinite":"none" }}/></div>
                <div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:13.5, color:C.ink }}>{d.customer}</div>
                  <div style={{ fontSize:9.5, color:C.faint, marginTop:2, letterSpacing:".06em" }}>Pkt #{d.packet_id}</div>
                </div>
                <div><TagChip>{d.workstream}</TagChip></div>
                <div style={{ textAlign:"right", fontFamily:DISP, fontWeight:600, fontSize:13, color:C.ink }}>${d.value}M</div>
                <div style={{ fontSize:11, color:C.muted }}>{d.stage}</div>
                <div style={{ textAlign:"right", fontFamily:DISP, fontWeight:600, fontSize:12, color:d.modeled_or<0.6?C.green:d.modeled_or<0.7?C.amber:C.red }}>{d.modeled_or.toFixed(2)}</div>
                <div style={{ textAlign:"right", fontFamily:DISP, fontWeight:500, fontSize:12, color:C.ink2 }}>{d.current_margin}%</div>
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:pbColor, fontWeight:600 }}>
                  <span style={{width:6,height:6,borderRadius:999,background:pbColor}}/>{pbLabel}
                </div>
                <div style={{ fontSize:10, color:C.muted, fontFamily:FONT }}>{d.owner}</div>
                <div style={{ textAlign:"right", color:C.goldDk, fontWeight:700 }}>→</div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Drill-in CTA */}
        <button onClick={() => setScreen("da-snapshot")}
          style={{ width:"100%", textAlign:"left", background:T.cardElevated, border:`1.5px solid ${C.green}44`, borderRadius:T.radLg, padding:"22px 28px", cursor:"pointer", fontFamily:FONT, boxShadow:T.shadow2, position:"relative", overflow:"hidden", display:"flex", justifyContent:"space-between", alignItems:"center", transition:`transform .2s ${T.ease}, box-shadow .2s ${T.ease}` }}
          onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadow3; }}
          onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow = T.shadow2; }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:C.green }} />
          <div style={{ flex:1, marginTop:4 }}>
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.green, textTransform:"uppercase", marginBottom:6 }}>Drill in →</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:24, color:C.ink, letterSpacing:"-.01em", marginBottom:6 }}>Open the Digital Deal Analyser Snapshot.</div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.55, maxWidth:760 }}>
              Bird's eye view of every in-flight Analyser Packet. See which deals are tracking to the playbook and which are deviating. The <strong style={{ color:C.red }}>AutoZone Packet 10941</strong> is flagged — analyst is requesting a guardrail override that needs your sign-off.
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0, marginLeft:24 }}>
            <div style={{ fontSize:9.5, fontWeight:700, color:C.muted, letterSpacing:".22em", textTransform:"uppercase", marginBottom:6 }}>Action required</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:20, color:C.red, letterSpacing:"-.01em" }}>1 packet</div>
            <div style={{ fontSize:10, color:C.faint, marginTop:4 }}>Pkt #10941 · AutoZone retention</div>
          </div>
        </button>
      </div>
    );
  };

  // ============================================================
  // SCREEN 2 · DEAL ANALYSER SNAPSHOT
  // ============================================================
  const renderDASnapshot = () => {
    const packets = daOverview.packets;
    const overrideCount = packets.filter(p => p.urgency === "critical").length;
    const totalBidValue = packets.reduce((s,p)=>s+p.bid_value, 0);
    const totalScenarios = packets.reduce((s,p)=>s+(p.scenarios?.length||0), 0);
    const modeledUplift = packets.reduce((s,p)=>s+Math.max(0, p.delta_profit), 0);

    const filtered = packetFilter === "All" ? packets
      : packetFilter === "Override" ? packets.filter(p => p.urgency === "critical")
      : packets.filter(p => p.workstream === packetFilter);

    const stageColor = { Sourced:C.muted, "Building Scenarios":C.brandLt, "Pricing Review":C.amber, "Customer Counter":C.red, Approved:C.green, "Override Flag":C.red };
    const urgencyColor = u => u==="critical"?C.red:u==="high"?C.amber:u==="med"?C.brandLt:C.muted;

    return (
      <div>
        {/* <Breadcrumb items={[
          {label:"Executive Home", onClick:onBack},
          {label:"Decision Lab", onClick:onBack},
          {label:"Enterprise Snapshot", onClick:() => setScreen("ent-snapshot")},
          {label:"Digital Deal Analyser Snapshot"},
        ]} /> */}

        <SH kicker="Window into the Deal Analyser tool"
          title="Deal Analyser — every Analyser Packet your pricing team is working on."
          sub="CCO-grade portfolio view across all in-flight Analyser Packets. Each packet rerated PLD history + scenario experiments inside the four incentive levels (L0 DIM · L1 Basic · L2 Tier · L4 Zone Min). See what's moving and where your intervention changes the number."
          right={<div style={{display:"flex",gap:6}}><TagChip tone="gold">{packets.length} packets · {totalScenarios} scenarios</TagChip>{overrideCount>0 && <TagChip tone="brick">{overrideCount} CCO action</TagChip>}</div>}
        />

        {/* Top KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
          <KCard label="Active Analyser Packets · Enterprise" value="187" delta="+12 QoQ" deltaLabel="Auto: 34 · 92% of <$10M in DA" status="ok" sub="52-wk GCPR PLD rerated nightly"/>
          <KCard label="Total bid value at stake" value="$3.1B" delta={`Auto: $${totalBidValue.toFixed(0)}M`} deltaLabel="annualized · all packets" status="ok" sub="Average 2.8 scenarios per packet"/>
          <KCard label="Modeled profit uplift (best)" value={`+$${Math.round(modeledUplift * 7.8)}M`} delta="" deltaLabel="vs baseline Current scenarios" status="ok" sub="If all best-scenarios closed at model"/>
          <KCard label="Margin realization · closed-won 90d" value="84%" delta="-6 pp" deltaLabel="vs 95% target" status="warn" sub="Post-DA concessions main driver"/>
        </div>

        {/* Lever activity + pipeline */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:18, marginBottom:32 }}>
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 26px", boxShadow:T.shadow1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ width:14, height:1, background:T.goldFoil }} />
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Incentive-lever activity · what analysts are tweaking</div>
              </div>
              <div style={{ fontSize:10, color:C.faint }}>across 187 packets · last 7 days</div>
            </div>
            {daOverview.lever_activity.map((l,i,arr) => {
              const c = resolveColor(l.color_key);
              return (
                <div key={l.id} style={{ paddingTop:14, marginTop:i>0?14:0, borderTop:i>0?`1px solid ${C.line}`:"none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", padding:"3px 8px", borderRadius:T.radSm, background:`${c}22`, color:c }}>{l.lvl}</span>
                      <span style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:C.ink }}>{l.name}</span>
                    </div>
                    <div style={{ fontSize:10, color:C.muted, fontFamily:FONT }}>{l.packets} packets · {l.pct_touched}% of portfolio</div>
                  </div>
                  <div style={{ fontSize:11.5, color:C.muted, marginBottom:8, lineHeight:1.5 }}>{l.description}</div>
                  <div style={{ height:5, borderRadius:T.radPill, background:C.line, overflow:"hidden", marginBottom:6 }}>
                    <div style={{ height:"100%", borderRadius:T.radPill, background:c, width:`${l.pct_touched}%` }}/>
                  </div>
                  <div style={{ fontSize:10, color:C.faint, fontStyle:"italic" }}>↳ {l.examples}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"20px 22px", boxShadow:T.shadow1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <span style={{ width:14, height:1, background:T.goldFoil }} />
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Packet pipeline · by stage</div>
              </div>
              {daOverview.pipeline_stages.map((s,i,arr) => {
                const c = resolveColor(s.color_key);
                const pct = (s.count / Math.max(...daOverview.pipeline_stages.map(x=>x.count))) * 100;
                return (
                  <div key={s.id} style={{ padding:"10px 0", borderBottom:i<arr.length-1?`1px solid ${C.line}`:"none" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:12 }}>
                      <span style={{ color:C.ink, fontWeight:500 }}>{s.stage}</span>
                      <span style={{ fontFamily:DISP, fontWeight:600, color:C.ink }}>{s.count}</span>
                    </div>
                    <div style={{ height:4, borderRadius:T.radPill, background:C.line, overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:T.radPill, background:c, width:`${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {overrideCount > 0 && (
              <div style={{ background:T.cardElevated, border:`1.5px solid ${C.red}55`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow2, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:C.red }} />
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, marginTop:2 }}>
                  <span style={{ width:7, height:7, borderRadius:999, background:C.red, animation:"pulse 1.5s infinite" }}/>
                  <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.red, textTransform:"uppercase" }}>CCO action required</span>
                </div>
                <div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:C.ink, marginBottom:8 }}>Packet 10941 · AutoZone</div>
                <div style={{ fontSize:11.5, color:C.ink2, lineHeight:1.55, marginBottom:12 }}>Analyst-recommended S3 breaches L2 Tier ceiling (TARGET 143% vs 81.1% policy). Override needs sign-off before customer counter.</div>
                <button onClick={() => { setExpandedPacket(10941); setPacketFilter("All"); }}
                  style={{ width:"100%", fontSize:10.5, fontWeight:700, padding:"9px 14px", borderRadius:T.radSm, background:C.red, color:"#fff", border:"none", cursor:"pointer", fontFamily:FONT, letterSpacing:".12em", textTransform:"uppercase" }}>
                  Open packet ↓
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Live Analyser Packets · Auto cross-cut</span>
          <div style={{ flex:1, height:1, background:C.line, marginLeft:8 }}/>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap" }}>
          {["All","Renewal","Retention","Penetration","New Logo","Override"].map(f => (
            <button key={f} onClick={() => setPacketFilter(f)}
              style={{ fontSize:11, fontWeight: packetFilter===f?700:500, padding:"7px 14px", borderRadius:T.radPill, border:`1px solid ${packetFilter===f?C.gold:C.line}`, background: packetFilter===f?`${C.gold}10`:C.card, color: packetFilter===f?C.goldDk:C.muted, cursor:"pointer", fontFamily:FONT, letterSpacing:".06em" }}>
              {f}{f==="Override" && overrideCount>0 ? ` · ${overrideCount}`:""}
            </button>
          ))}
          <div style={{ marginLeft:"auto", fontSize:10, color:C.faint }}>Showing {filtered.length} of {packets.length} · Sub-Ind: Automotive</div>
        </div>

        {/* Packets table */}
        <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, marginBottom:18, boxShadow:T.shadow1, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:"minmax(180px,2fr) 90px 100px 44px 80px 100px 56px 78px minmax(100px,1fr) 130px", padding:"12px 16px", borderBottom:`1px solid ${C.line}`, fontSize:8.5, fontWeight:700, letterSpacing:".14em", color:C.muted, textTransform:"uppercase", columnGap:10, minWidth:1100 }}>
              <div>Customer · Packet</div><div>Workstream</div><div>Analyst</div><div style={{textAlign:"center"}}>Scns</div><div style={{textAlign:"right"}}>Bid</div><div style={{textAlign:"right"}}>ADV / RPP</div><div style={{textAlign:"right"}}>OR</div><div style={{textAlign:"right"}}>Δ Profit</div><div>Levers</div><div>Status</div>
            </div>
          </div>
          {filtered.map((p,i,arr) => {
            const best = p.scenarios?.find(s => s.isBest) || p.scenarios?.[p.scenarios.length - 1] || {};
            const isExp = expandedPacket === p.packet_id;
            return (
              <React.Fragment key={p.id}>
                <div style={{ overflowX:"auto", background:isExp?`${C.gold}06`:"transparent", borderBottom:!isExp&&i<arr.length-1?`1px solid ${C.line}`:"none" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"minmax(180px,2fr) 90px 100px 44px 80px 100px 56px 78px minmax(100px,1fr) 130px", padding:"14px 16px", fontSize:12, alignItems:"center", cursor:"pointer", transition:`background .15s ${T.ease}`, columnGap:10, minWidth:1100 }}
                    onClick={() => setExpandedPacket(isExp ? null : p.packet_id)}
                    onMouseEnter={e => { if(!isExp) e.currentTarget.parentElement.style.background = `${C.gold}04`; }}
                    onMouseLeave={e => { if(!isExp) e.currentTarget.parentElement.style.background = "transparent"; }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:urgencyColor(p.urgency), animation:p.urgency==="critical"?"pulse 1.5s infinite":"none", flexShrink:0 }}/>
                      <div style={{ minWidth:0, overflow:"hidden" }}>
                        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:13, color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.customer}</div>
                        <div style={{ fontSize:9.5, color:C.faint, marginTop:2, letterSpacing:".04em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>#{p.packet_id} · {p.sub_ind}</div>
                      </div>
                    </div>
                    <div><TagChip>{p.workstream}</TagChip></div>
                    <div style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.analyst}</div>
                    <div style={{ textAlign:"center", fontFamily:DISP, fontWeight:600, fontSize:12, color:C.ink2 }}>{p.scenarios?.length || 0}</div>
                    <div style={{ textAlign:"right", fontFamily:DISP, fontWeight:600, fontSize:13, color:C.ink, whiteSpace:"nowrap" }}>${p.bid_value}M</div>
                    <div style={{ textAlign:"right", fontFamily:DISP, fontSize:11, color:C.ink2, whiteSpace:"nowrap" }}>{best.adv > 0 ? best.adv.toFixed(1) : "—"} / ${best.rpp > 0 ? best.rpp.toFixed(2) : "—"}</div>
                    <div style={{ textAlign:"right", fontFamily:DISP, fontWeight:600, fontSize:12, color: best.or > 0.7 ? C.red : best.or > 0.6 ? C.amber : best.or > 0 ? C.green : C.muted }}>{best.or > 0 ? best.or.toFixed(2) : "—"}</div>
                    <div style={{ textAlign:"right", fontFamily:DISP, fontWeight:600, fontSize:12, color:p.delta_profit > 0 ? C.green : C.red, whiteSpace:"nowrap" }}>{p.delta_profit > 0 ? "+" : ""}${p.delta_profit.toFixed(1)}M</div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
                      {(p.levers_touched||[]).slice(0,3).map((l,j) => <span key={j} style={{ fontSize:9, padding:"2px 6px", borderRadius:T.radSm, background:C.line, color:C.muted, fontFamily:FONT, whiteSpace:"nowrap" }}>{l}</span>)}
                      {(p.levers_touched||[]).length > 3 && <span style={{ fontSize:9, color:C.faint }}>+{p.levers_touched.length-3}</span>}
                    </div>
                    <div>
                      <span style={{ display:"inline-block", fontSize:9, padding:"4px 9px", borderRadius:T.radPill, background:`${stageColor[p.status]||C.muted}18`, color:stageColor[p.status]||C.muted, fontWeight:700, letterSpacing:".08em", whiteSpace:"nowrap", maxWidth:"100%", overflow:"hidden", textOverflow:"ellipsis" }}>{p.status}</span>
                    </div>
                  </div>
                </div>

                {isExp && (
                  <div style={{ background:`${C.paper}80`, borderBottom:`1px solid ${C.line}`, padding:"24px 28px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                      <div>
                        <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase", marginBottom:6 }}>Analyser Packet · drill-in</div>
                        <div style={{ display:"flex", alignItems:"baseline", gap:14 }}>
                          <div style={{ fontFamily:DISP, fontWeight:600, fontSize:24, color:C.ink, letterSpacing:"-.01em" }}>{p.customer}</div>
                          <div style={{ fontSize:10, color:C.muted, letterSpacing:".06em" }}>Packet #{p.packet_id} · Ref {p.ref_num} · {p.sub_ind}</div>
                        </div>
                        <div style={{ fontSize:10, color:C.faint, marginTop:4 }}>Source: {p.pld_source} · Construct: {p.construct} · Analyst: {p.analyst} · Last update {p.last_update}</div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        {p.urgency==="critical" && <span style={{ fontSize:10, fontWeight:700, padding:"7px 14px", borderRadius:T.radSm, background:C.red, color:"#fff", fontFamily:FONT, letterSpacing:".12em", textTransform:"uppercase" }}>Action required</span>}
                        <button onClick={() => toast.push({ tone:"stub", title:"Open in Deal Analyser", body:`Would deep-link to DA app for Packet #${p.packet_id} (${p.customer}).`, note:"Yet to integrate — DA single-sign-on link pending." })}
                          style={{ fontSize:10, fontWeight:700, padding:"7px 14px", borderRadius:T.radSm, background:"transparent", color:C.ink, border:`1px solid ${C.line2}`, cursor:"pointer", fontFamily:FONT, letterSpacing:".12em", textTransform:"uppercase" }}>Open in DA →</button>
                      </div>
                    </div>

                    {/* Bids */}
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:9, fontWeight:700, letterSpacing:".24em", color:C.muted, textTransform:"uppercase", marginBottom:8 }}>Bids in packet</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                        {(p.bids||[]).map((b,j) => <span key={j} style={{ fontSize:10, padding:"6px 12px", borderRadius:T.radSm, background:C.card, color:C.ink2, border:`1px solid ${C.line2}`, fontFamily:FONT }}>{b}</span>)}
                      </div>
                    </div>

                    {/* Scenarios table */}
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:9, fontWeight:700, letterSpacing:".24em", color:C.muted, textTransform:"uppercase", marginBottom:8 }}>Scenarios · P&L comparison (mirrors DA Comparison tab)</div>
                      <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radMd, overflow:"hidden" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"2.5fr 60px 70px 70px 70px 80px 60px 70px 1fr", padding:"10px 14px", borderBottom:`1px solid ${C.line}`, background:C.line, fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.muted, textTransform:"uppercase" }}>
                          <div>Scenario</div><div style={{textAlign:"right"}}>ADV</div><div style={{textAlign:"right"}}>Base Disc</div><div style={{textAlign:"right"}}>Total Disc</div><div style={{textAlign:"right"}}>RPP</div><div style={{textAlign:"right"}}>Revenue</div><div style={{textAlign:"right"}}>OR</div><div style={{textAlign:"right"}}>Profit</div><div style={{textAlign:"right"}}>Modeled at</div>
                        </div>
                        {(p.scenarios||[]).map((s,j,sarr) => (
                          <div key={j} style={{ display:"grid", gridTemplateColumns:"2.5fr 60px 70px 70px 70px 80px 60px 70px 1fr", padding:"10px 14px", borderBottom:j<sarr.length-1?`1px solid ${C.line}`:"none", fontSize:11, alignItems:"center", background:s.isBest?`${C.gold}06`:s.isOverride?`${C.red}06`:"transparent" }}>
                            <div>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontSize:10, fontFamily:FONT, fontWeight:600, color:C.ink }}>{s.name}</span>
                                {s.isBest && <span style={{ fontSize:7.5, fontWeight:700, padding:"2px 6px", borderRadius:T.radSm, background:T.goldFoil, color:C.navBg, letterSpacing:".1em", textTransform:"uppercase" }}>Recommended</span>}
                                {s.isOverride && <span style={{ fontSize:7.5, fontWeight:700, padding:"2px 6px", borderRadius:T.radSm, background:C.red, color:"#fff", letterSpacing:".1em", textTransform:"uppercase" }}>Override</span>}
                              </div>
                              <div style={{ fontSize:9.5, color:C.faint, marginTop:3 }}>{s.desc}</div>
                            </div>
                            <div style={{ textAlign:"right", fontFamily:DISP }}>{s.adv > 0 ? s.adv.toFixed(1) : "—"}</div>
                            <div style={{ textAlign:"right", fontFamily:DISP }}>{s.baseDisc > 0 ? s.baseDisc.toFixed(1)+"%" : "—"}</div>
                            <div style={{ textAlign:"right", fontFamily:DISP }}>{s.totalDisc > 0 ? s.totalDisc.toFixed(1)+"%" : "—"}</div>
                            <div style={{ textAlign:"right", fontFamily:DISP }}>{s.rpp > 0 ? "$"+s.rpp.toFixed(2) : "—"}</div>
                            <div style={{ textAlign:"right", fontFamily:DISP }}>{s.rev > 0 ? "$"+s.rev.toFixed(1)+"M" : "—"}</div>
                            <div style={{ textAlign:"right", fontFamily:DISP, color: s.or > 0.7 ? C.red : s.or > 0.6 ? C.amber : s.or > 0 ? C.green : C.muted }}>{s.or > 0 ? s.or.toFixed(2) : "—"}</div>
                            <div style={{ textAlign:"right", fontFamily:DISP, fontWeight:600, color:s.isBest?C.goldDk:C.ink }}>{s.profit > 0 ? "$"+s.profit.toFixed(1)+"M" : "—"}</div>
                            <div style={{ textAlign:"right", fontSize:10, color:C.muted, fontFamily:FONT }}>{s.modeledTier}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CCO intervention */}
                    {p.urgency === "critical" && (
                      <div style={{ background:`${C.red}05`, border:`1.5px solid ${C.red}44`, borderLeft:`3px solid ${C.red}`, borderRadius:T.radLg, padding:"18px 22px", marginBottom:14 }}>
                        <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.red, textTransform:"uppercase", marginBottom:8 }}>Why this needs you</div>
                        <div style={{ fontSize:13, color:C.ink, lineHeight:1.7, marginBottom:14 }}>
                          Analyst T. Whitaker has staged S3 to match FedEx's counter offer. The scenario breaches your <strong style={{ fontFamily:FONT, color:C.ink }}>L2 Tier Incentive</strong> ceiling policy (TARGET % Modeled raised from 81.1% → 143.1%) and approaches your <strong style={{ fontFamily:FONT, color:C.ink }}>L1 zone discount</strong> floor. Modeled OR jumps to 0.70 (target ≤ 0.62 for Aftermarket Tier-1). Either approve the override, raise the ceiling permanently, or send back with a guardrailed scenario.
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
                          <button onClick={() => setScreen("deal-workbench")}
                            style={{ fontSize:11, fontWeight:700, padding:"9px 16px", borderRadius:T.radSm, background:T.goldFoil, color:C.navBg, border:"none", cursor:"pointer", fontFamily:FONT, letterSpacing:".1em", textTransform:"uppercase", boxShadow:T.shadowGoldGlow }}>
                            Open Deal Workbench →
                          </button>
                          <button onClick={() => toast.push({ tone:"stub", title:"Send back to analyst", body:`Packet #${p.packet_id} · ${p.customer} would be returned to ${p.analyst} for re-staging with guardrailed scenario.`, note:"Yet to integrate — analyst routing workflow pending." })}
                            style={{ fontSize:11, fontWeight:600, padding:"9px 16px", borderRadius:T.radSm, background:"transparent", color:C.ink, border:`1px solid ${C.line2}`, cursor:"pointer", fontFamily:FONT, letterSpacing:".1em", textTransform:"uppercase" }}>Send back to analyst</button>
                          <button onClick={() => toast.push({ tone:"warn", title:"Approve override (single-use)", body:`Packet #${p.packet_id} · L2 ceiling 81% → 143% would be approved single-use for this packet only.`, note:"Yet to integrate — override audit + DA write-back pending." })}
                            style={{ fontSize:11, fontWeight:600, padding:"9px 16px", borderRadius:T.radSm, background:"transparent", color:C.red, border:`1px solid ${C.red}`, cursor:"pointer", fontFamily:FONT, letterSpacing:".1em", textTransform:"uppercase" }}>Approve override (single-use)</button>
                          <button onClick={() => toast.push({ tone:"stub", title:"Escalate to Pricing Committee", body:`Packet #${p.packet_id} · ${p.customer} would route to CFO + Pricing Committee for next session.`, note:"Yet to integrate — committee calendar + dossier auto-build pending." })}
                            style={{ fontSize:11, fontWeight:600, padding:"9px 16px", borderRadius:T.radSm, background:"transparent", color:C.ink2, border:`1px solid ${C.line2}`, cursor:"pointer", fontFamily:FONT, letterSpacing:".1em", textTransform:"uppercase" }}>Escalate to Pricing Committee</button>
                        </div>
                      </div>
                    )}

                    {/* Lever ladder */}
                    <div>
                      <div style={{ fontSize:9, fontWeight:700, letterSpacing:".24em", color:C.muted, textTransform:"uppercase", marginBottom:10 }}>Pricing Terms preview · what changed across scenarios</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                        {[
                          { lvl:"L0", name:"DIM Divisor", changed:(p.levers_touched||[]).includes("L0"), color:C.brandLt, note: p.packet_id===10941?"unchanged at 150":p.packet_id===10892?"150 → 162":"150 → 156" },
                          { lvl:"L1", name:"Basic (Zones + Accessorials)", changed:(p.levers_touched||[]).some(l=>l.startsWith("L1")), color:C.gold, note: p.packet_id===10941?"Zone -3pp · FSC unchanged":p.packet_id===10892?"Zone reshape · FSC -2pp":"Multiple touched" },
                          { lvl:"L2", name:"Tier Incentives (% Modeled)", changed:(p.levers_touched||[]).includes("L2"), color:C.green, note: p.packet_id===10941?"TARGET 81% → 143% (OVERRIDE)":"TARGET held at 81.1%" },
                          { lvl:"L4", name:"Zone Minimums", changed:(p.levers_touched||[]).includes("L4"), color:C.red, note: p.packet_id===10941?"Lowered (concern)":p.packet_id===10892?"Raised (good)":"Held" },
                        ].map((l,j) => (
                          <div key={j} style={{ background:C.card, border:`1px solid ${l.changed?l.color+"66":C.line}`, borderRadius:T.radMd, padding:"12px 14px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                              <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:T.radSm, background:l.changed?`${l.color}22`:C.line, color:l.changed?l.color:C.muted, letterSpacing:".14em" }}>{l.lvl}</span>
                              {l.changed ? <span style={{ fontSize:9, fontWeight:700, color:l.color, letterSpacing:".06em" }}>● MODIFIED</span> : <span style={{ fontSize:9, color:C.faint }}>○ unchanged</span>}
                            </div>
                            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:12, color:C.ink, marginBottom:4 }}>{l.name}</div>
                            <div style={{ fontSize:10, color:C.muted, fontFamily:FONT }}>{l.note}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ fontSize:10, color:C.faint, fontStyle:"italic", marginBottom:24 }}>Click any row to drill into the packet · drill-in mirrors the analyst's Deal Analyser view (Customer Details → Scenarios → Comparison → Pricing Terms)</div>
      </div>
    );
  };

  // ============================================================
  // SCREEN 3 · DEAL EXPERIMENTATION WORKBENCH
  // ============================================================
  const renderDealWorkbench = () => {
    const focusPacket = (snapshot?.strategic_deals || []).find(d => d.packet_id === 10941) || { customer:"AutoZone", packet_id:10941, workstream:"Retention", value:62, owner:"T. Whitaker" };

    // Local outcome readout for the live lever values
    const liveOutcomes = (() => {
      const l2 = leverVals.l2Ceiling ?? 1, l0 = leverVals.l0Floor ?? 150, l1 = leverVals.l1AccCeiling ?? 20;
      const l4 = leverVals.l4ZoneMin ?? 1, rigor = leverVals.scenarioRigor ?? 3, overlay = leverVals.seniorAnalyst ?? 20, posture = leverVals.macroPosture ?? 1;
      const l2d = l2-1, l0d = l0-150, l1d = 20-l1, l4m = l4-1, rd = rigor-3, od = overlay-20;
      const pm = posture===0?1.0:posture===2?-0.6:0.3;
      const ml = -l2d*0.12 + l0d*0.05 + l1d*0.06 + l4m*0.18 + rd*0.08 + od*0.018 + pm*0.05;
      const rl = l2d*8 + l0d*12 - l1d*4 + od*4.2 + pm*22 + rd*14;
      const lk = -(l1d*6) - (l2d>0?Math.abs(l2d)*4:0) - (od*0.5);
      const wr = l2d*0.4 + od*0.12 + pm*-0.8 + l1d*-0.2;
      const rc = l1d*0.6 + l0d*0.05 + od*0.05 + l4m*1.4 + rd*0.6;
      const pl = l0d*18 + l2d*6 + l1d*5 + l4m*24 + od*4 + pm*18;
      const aff = (l2!==1?23:0)+(l0!==150?64:0)+(l1!==20?142:0)+(l4!==1?89:0)+(rigor!==3?187:0)+(overlay!==20?Math.abs(overlay-20):0);
      return { rev: 9420 + rl, margin: 6.2+ml, leakage: Math.max(0, 46+lk), realization: Math.min(100, Math.max(0, 84+rc)), winRate: 68+wr, modeledProfit: 810+pl, rl, ml, lk, wr, rc, pl, affected: Math.min(187, aff) };
    })();

    const governance = (() => {
      const r = new Set();
      if ((leverVals.l2Ceiling??1) !== 1) { r.add("CFO"); r.add("Pricing Committee"); }
      if ((leverVals.l0Floor??150) !== 150) r.add("CFO");
      if ((leverVals.l1AccCeiling??20) !== 20) { r.add("VP Revenue Management"); r.add("CFO"); }
      if ((leverVals.l4ZoneMin??1) !== 1) r.add("CFO");
      if ((leverVals.macroPosture??1) !== 1) r.add("CEO");
      if ((leverVals.scenarioRigor??3) !== 3 || (leverVals.seniorAnalyst??20) !== 20) r.add("VP Revenue Management");
      return Array.from(r);
    })();

    const autoZoneStatus = (() => {
      const l2 = leverVals.l2Ceiling ?? 1;
      if (l2 >= 3) return { state:"resolved", label:"✓ Override no longer needed — analyst can re-route normally", color:C.green };
      if (l2 === 2) return { state:"partial", label:"⚠ Still blocks AutoZone S3. Approve single-use or escalate.", color:C.amber };
      return { state:"blocked", label:"S3 still breaches policy. Open the AutoZone packet from Deal Analyzer Snapshot →", color:C.red };
    })();

    const leversByCategory = {};
    leverDefs.forEach(l => {
      const cat = l.category;
      if (!leversByCategory[cat]) leversByCategory[cat] = [];
      leversByCategory[cat].push(l);
    });

    const onResultsScreen = screen === "results";

    return (
      <div>
        {/* <Breadcrumb items={onResultsScreen ? [
          {label:"Executive Home", onClick:onBack},
          {label:"Decision Lab", onClick:onBack},
          {label:"Enterprise Snapshot", onClick:() => setScreen("ent-snapshot")},
          {label:"Deal Analyzer Snapshot", onClick:() => setScreen("da-snapshot")},
          {label:"Deal Workbench", onClick:() => setScreen("deal-workbench")},
          {label:"Results"},
        ] : [
          {label:"Executive Home", onClick:onBack},
          {label:"Decision Lab", onClick:onBack},
          {label:"Enterprise Snapshot", onClick:() => setScreen("ent-snapshot")},
          {label:"Deal Analyzer Snapshot", onClick:() => setScreen("da-snapshot")},
          {label:"Deal Workbench"},
        ]} /> */}

        {!onResultsScreen && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <button onClick={() => setScreen("da-snapshot")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:11, fontWeight:700, letterSpacing:".1em", color:C.muted, textTransform:"uppercase", padding:0 }}>← Back to Deal Analyzer Snapshot</button>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={resetToAsIs} style={{ background:"none", border:`1px solid ${C.line}`, cursor:"pointer", fontFamily:FONT, fontSize:10, fontWeight:700, letterSpacing:".1em", color:resetFlash==="asis"?C.green:C.muted, padding:"5px 12px", borderRadius:6, borderColor:resetFlash==="asis"?C.green:C.line, textTransform:"uppercase" }}>{resetFlash==="asis"?"✓ As-Is restored":"↺ Reset to As-Is"}</button>
              <button onClick={resetToRecommended} style={{ background:"none", border:`1px solid ${C.gold}55`, cursor:"pointer", fontFamily:FONT, fontSize:10, fontWeight:700, letterSpacing:".1em", color:resetFlash==="rec"?C.goldDk:C.goldDk, padding:"5px 12px", borderRadius:6, borderColor:resetFlash==="rec"?C.goldDk:`${C.gold}55`, textTransform:"uppercase" }}>{resetFlash==="rec"?"✓ Recommended restored":"↻ Reset to Recommended"}</button>
            </div>
          </div>
        )}

        {onResultsScreen ? (
          <SH kicker={`Results · Option ${appliedOption ? String.fromCharCode(65+appliedOption.id) : "—"}`}
            title="Impact on the deal economics — visualised."
            sub="Margin recovery trajectory, phased impact timeline, and routing pipeline for committee sign-off."
            right={<div style={{display:"flex",gap:6}}><TagChip tone="gold">{appliedOption ? `${appliedOption.affected_packets} packets affected` : "—"}</TagChip></div>}
          />
        ) : (
          <SH kicker="CCO experimentation"
            title="Set the envelope your pricing analysts operate within."
            sub="Pricing analysts experiment deal-by-deal inside Deal Analyser at the four incentive levels (L0 DIM · L1 Basic · L2 Tier · L4 Zone Min). You set the policy ceilings, the analyst capacity overlay, and the macro posture the entire DA portfolio inherits — and watch what the recompute does to the AutoZone override case."
            right={<div style={{display:"flex",gap:6}}><TagChip tone="brick">Action required · Pkt #10941</TagChip><TagChip tone="gold">{stagedCount} staged</TagChip></div>}
          />
        )}

        {!onResultsScreen && (<>
        {/* workbench-only content below */}

        {/* Top 4 KPI cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, opacity:.5 }} />
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:10 }}>Enterprise Plan · FY26</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:30, color:C.ink, letterSpacing:"-.02em", lineHeight:1 }}>$9.42B</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>187 packets in-flight</div>
          </div>
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, opacity:.5 }} />
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:10 }}>Margin Realization · current</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:30, color:C.ink, letterSpacing:"-.02em", lineHeight:1 }}>{asIsOutcomes.realization}%</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Target ≥ 90%</div>
          </div>
          <div style={{ background:`${C.red}06`, border:`1.5px solid ${C.red}44`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:C.red }} />
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.red, textTransform:"uppercase", marginBottom:10 }}>Discount Leakage · YTD</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:30, color:C.red, letterSpacing:"-.02em", lineHeight:1 }}>${asIsOutcomes.leakage}M</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Accessorial + override bleed</div>
          </div>
          <div style={{ background:`${C.gold}06`, border:`1.5px solid ${C.gold}44`, borderRadius:T.radLg, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil }} />
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase", marginBottom:10 }}>Modeled Profit Lift</div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:30, color:C.goldDk, letterSpacing:"-.02em", lineHeight:1 }}>+${Math.round(liveOutcomes.modeledProfit - asIsOutcomes.modeledProfit)}M</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{liveOutcomes.affected} packets · +{(liveOutcomes.margin - asIsOutcomes.margin).toFixed(1)}% margin</div>
          </div>
        </div>

        {/* Focus packet strip */}
        <div style={{ background:T.cardElevated, border:`1.5px solid ${C.red}55`, borderRadius:T.radLg, padding:"16px 22px", marginBottom:22, display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadow2, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:C.red }} />
          <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:2 }}>
            <span style={{ width:8, height:8, borderRadius:999, background:C.red, animation:"pulse 1.5s infinite", boxShadow:`0 0 0 3px ${C.red}22` }}/>
            <div>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.red, textTransform:"uppercase", marginBottom:3 }}>Focus packet · pre-loaded for intervention</div>
              <div style={{ fontSize:13.5 }}>
                <span style={{ fontFamily:DISP, fontWeight:600, color:C.ink }}>{focusPacket.customer}</span>
                <span style={{ color:C.muted }}> · Packet #{focusPacket.packet_id} · {focusPacket.workstream} · ${focusPacket.value}M annualized</span>
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>Deviation: L2 Tier ceiling breach (TARGET 81% → 143% requested) · analyst {focusPacket.owner}</div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, fontWeight:700, color:C.faint, letterSpacing:".22em", textTransform:"uppercase", marginBottom:3 }}>AutoZone resolution</div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".14em", color:autoZoneStatus.color, textTransform:"uppercase" }}>{autoZoneStatus.state}</div>
          </div>
        </div>

        {/* Section header */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <span style={{ width:14, height:1, background:T.goldFoil }} />
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>As-Is vs To-Be · Deal Guardrail Configuration</div>
          <span style={{ fontSize:10, color:C.faint }}>· {stagedCount} of {leverDefs.length} levers changed</span>
        </div>

        {/* Levers + outcome side panel */}
        <div style={{ display:"grid", gridTemplateColumns:"8fr 4fr", gap:18, marginBottom:24 }}>
          <div>
            {Object.entries(
              leverDefs.reduce((acc, l) => {
                const groupBy = l.category.split(" · ")[0];
                const groupKey = ["L0","L1","L2","L4"].includes(groupBy) ? "Pricing Policy · DA-aligned guardrails" : groupBy === "Process" || groupBy === "Capacity" ? "Process & Capacity" : "Strategic Posture";
                if (!acc[groupKey]) acc[groupKey] = { items:[], color: groupKey.includes("Pricing")?C.gold:groupKey.includes("Process")?C.green:C.brandLt };
                acc[groupKey].items.push(l);
                return acc;
              }, {})
            ).map(([groupKey, { items, color }]) => (
              <div key={groupKey} style={{ border:`1px solid ${color}44`, borderRadius:T.radLg, marginBottom:14, overflow:"hidden", background:`${color}05` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderBottom:`1px solid ${color}22` }}>
                  <span style={{ width:3, height:14, borderRadius:2, background:color }}/>
                  <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color, textTransform:"uppercase" }}>{groupKey}</span>
                  <span style={{ fontSize:10, color:C.faint }}>· {items.length} levers</span>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${C.line}` }}>
                      <th style={{ fontSize:8.5, fontWeight:700, letterSpacing:".18em", color:C.faint, textTransform:"uppercase", textAlign:"left", padding:"8px 16px", width:"30%" }}>Lever</th>
                      <th style={{ fontSize:8.5, fontWeight:700, letterSpacing:".18em", color:C.faint, textTransform:"uppercase", textAlign:"center", padding:"8px 8px", width:"12%" }}>As-Is</th>
                      <th style={{ width:"4%", padding:"8px 4px", textAlign:"center" }}></th>
                      <th style={{ fontSize:8.5, fontWeight:700, letterSpacing:".18em", color:C.faint, textTransform:"uppercase", textAlign:"center", padding:"8px 8px", width:"16%" }}>To-Be</th>
                      <th style={{ fontSize:8.5, fontWeight:700, letterSpacing:".18em", color:C.faint, textTransform:"uppercase", textAlign:"center", padding:"8px 16px", width:"38%" }}>Adjust</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((meta, ri) => {
                      const val = leverVals[meta.lever_key] ?? meta.default_val;
                      const asIsVal = ASIS_LEVERS[meta.lever_key] ?? meta.default_val;
                      const recVal = REC_LEVERS[meta.lever_key];
                      const mod = val !== asIsVal;
                      const isRec = recVal !== undefined && val === recVal;
                      return (
                        <tr key={meta.lever_key} style={{ borderBottom:ri<items.length-1?`1px solid ${C.line}11`:"none", background:mod?`${C.gold}06`:"transparent" }}>
                          <td style={{ padding:"10px 16px", verticalAlign:"middle" }}>
                            <div style={{ fontSize:12, fontWeight:600, color:C.ink, lineHeight:1.3 }}>{meta.title}</div>
                            {meta.constraint && <div style={{ fontSize:9, color:C.faint, marginTop:2 }}>{meta.constraint}</div>}
                          </td>
                          <td style={{ textAlign:"center", padding:"10px 8px", verticalAlign:"middle" }}>
                            <span style={{ fontSize:12, color:C.muted }}>{fmtDealLeverVal(meta, asIsVal)}</span>
                          </td>
                          <td style={{ textAlign:"center", padding:"10px 4px", verticalAlign:"middle" }}>
                            <span style={{ fontSize:13, color:mod?C.goldDk:C.line2 }}>→</span>
                          </td>
                          <td style={{ textAlign:"center", padding:"10px 8px", verticalAlign:"middle" }}>
                            <span style={{ fontSize:12, fontWeight:mod?700:400, color:mod?C.goldDk:C.muted }}>{fmtDealLeverVal(meta, val)}</span>
                            {isRec && <span style={{ display:"block", fontSize:8, fontWeight:700, color:C.green, marginTop:2 }}>✓ Recommended</span>}
                          </td>
                          <td style={{ padding:"10px 16px", verticalAlign:"middle" }}>
                            {meta.options ? (
                              <div style={{ display:"flex", gap:3, flexWrap:"wrap", justifyContent:"center" }}>
                                {meta.options.map((opt, oi) => (
                                  <button key={oi} onClick={() => setLever(meta.lever_key, oi)}
                                    style={{ fontSize:8.5, padding:"3px 7px", borderRadius:4, border:`1px solid ${val===oi?C.gold:C.line}`, background:val===oi?`${C.gold}15`:C.card, color:val===oi?C.goldDk:C.muted, cursor:"pointer", fontFamily:FONT, fontWeight:val===oi?700:500 }}>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <input type="range" min={meta.min_val} max={meta.max_val} step={meta.step} value={val} onChange={e => setLever(meta.lever_key, +e.target.value)} style={{ width:"100%", accentColor:mod?C.gold:C.brandLt }}/>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Right column */}
          <div style={{ display:"flex", flexDirection:"column", gap:14, position:"sticky", top:20, alignSelf:"start" }}>
            <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <span style={{ width:14, height:1, background:T.goldFoil }}/>
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Portfolio recompute · {liveOutcomes.affected} packets</div>
              </div>
              {[
                { label:"Ent. Revenue · FY26", val:`$${(liveOutcomes.rev/1000).toFixed(2)}B`, d:liveOutcomes.rl, unit:"$M" },
                { label:"Ent. Op. Margin", val:`${liveOutcomes.margin.toFixed(1)}%`, d:liveOutcomes.ml*100, unit:"bps" },
                { label:"Modeled Profit Uplift", val:`$${Math.round(liveOutcomes.modeledProfit)}M`, d:liveOutcomes.pl, unit:"$M" },
                { label:"Discount Leakage", val:`$${Math.round(liveOutcomes.leakage)}M`, d:liveOutcomes.lk, unit:"$M", inv:true },
                { label:"Margin Realization", val:`${Math.round(liveOutcomes.realization)}%`, d:liveOutcomes.rc, unit:"pp" },
                { label:"Win Rate (90d)", val:`${Math.round(liveOutcomes.winRate)}%`, d:liveOutcomes.wr, unit:"pp" },
              ].map((m,i,arr) => {
                const pos = m.inv ? m.d < 0 : m.d > 0;
                const col = pos ? C.green : m.d === 0 ? C.muted : C.red;
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"8px 0", borderBottom:i<arr.length-1?`1px solid ${C.line}`:"none" }}>
                    <div style={{ fontSize:9.5, color:C.muted, letterSpacing:".14em", textTransform:"uppercase", fontWeight:600 }}>{m.label}</div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:C.ink }}>{m.val}</div>
                      <div style={{ fontSize:10, color:col, fontWeight:600 }}>{m.d > 0 ? "+":""}{m.unit==="bps"?Math.round(m.d):(Math.round(m.d*10)/10).toFixed(1)} {m.unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background:T.cardElevated, border:`1.5px solid ${autoZoneStatus.color}55`, borderRadius:T.radLg, padding:"16px 18px", boxShadow:T.shadow1, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:autoZoneStatus.color }} />
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:autoZoneStatus.color, textTransform:"uppercase", marginBottom:8, marginTop:2 }}>AutoZone · live resolution</div>
              <div style={{ fontSize:12, color:C.ink, lineHeight:1.55 }}>{autoZoneStatus.label}</div>
            </div>

            <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"16px 18px", boxShadow:T.shadow1 }}>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.muted, textTransform:"uppercase", marginBottom:10 }}>Required approvers</div>
              {governance.length === 0
                ? <div style={{ fontSize:11, color:C.faint, fontStyle:"italic" }}>No staged changes · no approvers required</div>
                : <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{governance.map((g,i) => <span key={i} style={{ fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:T.radSm, background:`${C.gold}18`, color:C.goldDk, letterSpacing:".08em" }}>{g}</span>)}</div>}
            </div>

            {/* Simulated vs As-Is quick read */}
            <div style={{ background:T.cardElevated, border:`1px solid ${C.gold}33`, borderRadius:T.radLg, padding:"16px 18px", boxShadow:T.shadow1 }}>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase", marginBottom:12 }}>Simulated vs As-Is · quick read</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                {[
                  { label:"Profit Δ", val:`+$${Math.round(liveOutcomes.modeledProfit - asIsOutcomes.modeledProfit)}M`, pos:liveOutcomes.modeledProfit >= asIsOutcomes.modeledProfit },
                  { label:"Realization Δ", val:`+${(liveOutcomes.realization - asIsOutcomes.realization).toFixed(1)}pp`, pos:liveOutcomes.realization >= asIsOutcomes.realization },
                  { label:"Leakage Δ", val:`${liveOutcomes.leakage - asIsOutcomes.leakage > 0 ? "+":""}$${Math.round(liveOutcomes.leakage - asIsOutcomes.leakage)}M`, pos:liveOutcomes.leakage <= asIsOutcomes.leakage },
                  { label:"Win Rate Δ", val:`${liveOutcomes.winRate - asIsOutcomes.winRate > 0 ? "+":""}${(liveOutcomes.winRate - asIsOutcomes.winRate).toFixed(1)}pp`, pos:liveOutcomes.winRate >= asIsOutcomes.winRate },
                ].map((m,i) => (
                  <div key={i} style={{ background:C.card, borderRadius:6, padding:"8px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:8.5, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".14em", marginBottom:4 }}>{m.label}</div>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:m.pos?C.green:C.red }}>{m.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:10, color:C.muted, textAlign:"center", borderTop:`1px solid ${C.line}`, paddingTop:8 }}>
                Gap to 90% realization: {Math.round(Math.max(0, 90 - liveOutcomes.realization))}pp remaining
              </div>
            </div>
          </div>
        </div>

        {/* SIMULATION FLOW */}
        {simState === "idle" && (
          <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 26px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadow2, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, opacity:.5 }} />
            <div>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase", marginBottom:6 }}>Modeled outcome · Enterprise FY26 (current guardrail vector)</div>
              <div style={{ fontSize:15, lineHeight:1.7 }}>
                <span style={{ fontFamily:DISP, fontWeight:600, color:C.goldDk, fontSize:18 }}>${(liveOutcomes.rev/1000).toFixed(2)}B revenue</span>
                <span style={{ color:C.faint, margin:"0 8px" }}>·</span>
                <span style={{ color:C.ink }}>{liveOutcomes.margin.toFixed(1)}% margin</span>
                <span style={{ color:C.faint, margin:"0 8px" }}>·</span>
                <span style={{ color:C.ink }}>{Math.round(liveOutcomes.realization)}% realization</span>
                <span style={{ color:C.faint, margin:"0 8px" }}>·</span>
                <span style={{ color:C.ink }}>${Math.round(liveOutcomes.leakage)}M leakage</span>
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>Run the simulator to generate three optimised intervention configurations and visualise the deal-economics impact.</div>
            </div>
            <div style={{ display:"flex", gap:10, flexShrink:0, marginLeft:24 }}>
              <Btn kind="ghost" small onClick={resetToAsIs}>↺ Reset</Btn>
              <Btn kind="gold" onClick={runSimulation}><Play size={13}/> Generate Options</Btn>
            </div>
          </div>
        )}

        {simState === "running" && (
          <div style={{ background:T.cardElevated, border:`1px solid ${C.gold}55`, borderRadius:T.radLg, padding:"28px 32px", boxShadow:T.shadowGoldGlow, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil, animation:"pulse 1.4s infinite" }} />
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:999, display:"grid", placeItems:"center", background:`${C.gold}10`, border:`1.5px solid ${C.gold}55` }}>
                <Loader2 size={20} color={C.goldDk} style={{ animation:"spin 1s linear infinite" }}/>
              </div>
              <div>
                <div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:C.ink, letterSpacing:"-.01em" }}>Recomputing the in-flight Analyser Packet portfolio…</div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:".24em", color:C.muted, textTransform:"uppercase", marginTop:4 }}>187 packets · 7-lever guardrail vector · FY26 trajectory · Monte Carlo n=10,000</div>
              </div>
            </div>
            <div style={{ marginLeft:64, display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { done:true, text:`Loaded all 187 in-flight Analyser Packets · ${snapshot.strategic_deals.length} strategic parent deals` },
                { done:true, text:"Loaded constraints: pricing committee SLA · senior analyst capacity · governance routing" },
                { done:true, text:"Loaded competitive context: FedEx Auto Express · USMCA surcharge · AutoZone override request" },
                { done:false, pulse:true, text:"Re-running each packet's scenario set against new guardrails…" },
                { done:false, text:"Generating three optimised intervention configurations…" },
                { done:false, text:"Projecting margin realization recovery trajectory…" },
              ].map((s,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, fontSize:12, color:s.done?C.ink2:C.faint, lineHeight:1.5 }}>
                  <div style={{ width:7, height:7, borderRadius:999, background:s.done?C.green:s.pulse?C.gold:C.line, animation:s.pulse?"pulse 1.5s infinite":"none", flexShrink:0 }}/>
                  {s.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {simState === "results" && simResult && (
          <div>
            <div style={{ background:T.cardElevated, border:`1.5px solid ${C.gold}40`, borderRadius:T.radLg, padding:"16px 20px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadow2 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ width:7, height:7, borderRadius:999, background:C.green }}/>
                  <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.green, textTransform:"uppercase" }}>Simulation complete · 2.2s · 187 packets recomputed</span>
                </div>
                <div style={{ fontSize:13, color:C.muted }}>Three optimised guardrail configurations. Each resolves AutoZone differently. Pick one to preview the deal-economics impact.</div>
              </div>
              <button onClick={() => setSimState("idle")} style={{ fontSize:10, fontWeight:700, color:C.muted, background:"none", border:"none", cursor:"pointer", fontFamily:FONT, letterSpacing:".14em", textTransform:"uppercase" }}>↻ Re-simulate</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:14 }}>
              {simResult.options.map(opt => {
                const c = resolveColor(opt.color_key);
                const isSel = selectedOptionIdx === opt.id;
                return (
                  <button key={opt.id} onClick={() => {
                      setSelectedOptionIdx(opt.id);
                      const optLevers = {};
                      Object.keys(ASIS_LEVERS).forEach(k => {
                        const asIs = ASIS_LEVERS[k]; const rec = REC_LEVERS[k];
                        if (opt.id === 0) optLevers[k] = typeof rec === "number" && !Number.isInteger(rec) ? +((asIs+rec)/2).toFixed(2) : Math.round((asIs+rec)/2);
                        else if (opt.id === 1) optLevers[k] = rec;
                        else { const meta = leverDefs.find(d => d.lever_key===k); optLevers[k] = meta ? Math.min(meta.max_val, typeof rec === "number" && !Number.isInteger(rec) ? +(rec*1.35).toFixed(2) : rec+1) : rec; }
                      });
                      setLeverVals(optLevers);
                    }}
                    style={{ textAlign:"left", background:isSel?T.cardElevated:C.card, border:`1.5px solid ${isSel?c:C.line}`, borderRadius:T.radLg, padding:"22px 24px", cursor:"pointer", fontFamily:FONT, position:"relative", overflow:"hidden", boxShadow:isSel?T.shadow2:T.shadow1 }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:c, opacity:isSel?1:.4 }} />
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, marginTop:4 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                          <span style={{ fontSize:9, fontWeight:700, letterSpacing:".22em", color:c, textTransform:"uppercase" }}>Option {String.fromCharCode(65+opt.id)}</span>
                          {opt.id===1 && <span style={{ fontSize:8.5, fontWeight:700, padding:"2px 8px", borderRadius:T.radPill, background:T.goldFoil, color:C.navBg, letterSpacing:".14em", textTransform:"uppercase" }}>AI Pick</span>}
                        </div>
                        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:19, color:C.ink, letterSpacing:"-.005em" }}>{opt.label}</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{opt.tag}</div>
                      </div>
                      <div style={{ width:20, height:20, borderRadius:999, border:`1.5px solid ${isSel?c:C.line2}`, display:"grid", placeItems:"center", flexShrink:0 }}>
                        {isSel && <div style={{ width:10, height:10, borderRadius:999, background:c }}/>}
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, padding:"14px 0", borderTop:`1px solid ${C.line}`, borderBottom:`1px solid ${C.line}`, marginBottom:14 }}>
                      <div><div style={{ fontSize:8.5, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".18em", marginBottom:4 }}>Revenue Lift</div><div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:c }}>+${Math.round(opt.rev_lift)}M</div></div>
                      <div><div style={{ fontSize:8.5, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".18em", marginBottom:4 }}>Margin Δ</div><div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:C.ink }}>+{Math.round(opt.margin_lift_bps)}bps</div></div>
                      <div><div style={{ fontSize:8.5, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".18em", marginBottom:4 }}>Profit Uplift</div><div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:C.ink2 }}>+${Math.round(opt.profit_lift)}M</div></div>
                      <div><div style={{ fontSize:8.5, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".18em", marginBottom:4 }}>Leakage Δ</div><div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:opt.leakage_change<0?C.green:C.red }}>{opt.leakage_change>0?"+":""}${opt.leakage_change}M</div></div>
                    </div>
                    <div style={{ fontSize:8.5, fontWeight:700, color:C.muted, textTransform:"uppercase", marginBottom:6, letterSpacing:".22em" }}>Key Guardrail Moves</div>
                    {opt.key_moves.map((m,i) => <div key={i} style={{ fontSize:11, color:C.ink2, lineHeight:1.5, marginBottom:4, display:"flex", gap:6 }}><span style={{color:c}}>·</span><span>{m}</span></div>)}
                    <div style={{ borderTop:`1px solid ${C.line}`, marginTop:12, paddingTop:10, display:"flex", justifyContent:"space-between", fontSize:9.5, color:C.muted }}>
                      <span>Risk: <strong style={{color:c}}>{opt.risk}</strong></span>
                      <span>{opt.affected_packets} packets · {opt.confidence}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 22px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadow2 }}>
              <div>
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase", marginBottom:5 }}>Selected · Ready to Apply</div>
                <div style={{ fontSize:14 }}>
                  <strong style={{ color:resolveColor(simResult.options[selectedOptionIdx].color_key) }}>{simResult.options[selectedOptionIdx].label}</strong>
                  <span style={{ color:C.faint, margin:"0 8px" }}>·</span>+${Math.round(simResult.options[selectedOptionIdx].rev_lift)}M revenue
                  <span style={{ color:C.faint, margin:"0 8px" }}>·</span>+{Math.round(simResult.options[selectedOptionIdx].margin_lift_bps)}bps margin
                  <span style={{ color:C.faint, margin:"0 8px" }}>·</span>{simResult.options[selectedOptionIdx].affected_packets} packets
                </div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Btn kind="ghost" small onClick={() => setSimState("idle")}>← Back to levers</Btn>
                <button onClick={() => applyOption(simResult.options[selectedOptionIdx])}
                  style={{ fontSize:11.5, fontWeight:700, padding:"10px 22px", borderRadius:T.radMd, background:resolveColor(simResult.options[selectedOptionIdx].color_key), color:"#fff", border:"none", cursor:"pointer", fontFamily:FONT, letterSpacing:".08em", textTransform:"uppercase" }}>
                  Apply Option {String.fromCharCode(65+selectedOptionIdx)} →
                </button>
              </div>
            </div>
          </div>
        )}
        </>)}

        {onResultsScreen && appliedOption && (() => {
          const c = resolveColor(appliedOption.color_key);
          const baseTraj = [78, 81, 83, 84, 83, 80, 78, 84, null, null, null, null];
          const trajShift = appliedOption.id === 0 ? 8 : appliedOption.id === 1 ? 6 : 1;
          const q3 = 84 + trajShift * 0.4, q4 = 84 + trajShift * 0.7, q1_27 = 84 + trajShift * 0.9, q2_27 = 84 + trajShift;
          const appliedTraj = [null,null,null,null,null,null,null, 84, q3, q4, q1_27, q2_27];
          const chartData = ["Q3 24","Q4 24","Q1 25","Q2 25","Q3 25","Q4 25","Q1 26","Q2 26","Q3 26","Q4 26","Q1 27","Q2 27"].map((q,i) => ({ q, plan:90, actual:baseTraj[i], applied:appliedTraj[i] }));
          const timeline = [
            { q:"Jul 26", phase:"Mobilize", impact:"$0M", lever:"Guardrail committee · governance routing · AutoZone resolution path locked", color:C.muted },
            { q:"Aug 26", phase:"Cascade", impact:`+$${Math.round(appliedOption.rev_lift * 0.15)}M`, lever:`${appliedOption.affected_packets} in-flight packets re-staged under new guardrails`, color:C.green },
            { q:"Q3 '26", phase:"Closed-won", impact:`+$${Math.round(appliedOption.rev_lift * 0.35)}M`, lever:"First batch of re-staged packets close at new margin profile", color:C.goldDk },
            { q:"Q4 '26", phase:"Margin lift", impact:`+$${Math.round(appliedOption.rev_lift * 0.65)}M`, lever:"Realization improves; leakage compresses on accessorials", color:C.goldDk },
            { q:"Q1 '27", phase:"Steady state", impact:`+$${Math.round(appliedOption.rev_lift * 0.9)}M`, lever:"Policy fully internalised · realization at 90%+ target", color:C.green },
          ];

          return (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ background:T.cardElevated, border:`1.5px solid ${c}`, borderRadius:T.radLg, padding:"22px 26px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadow2, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:c }} />
                <div style={{ marginTop:2 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ width:8, height:8, borderRadius:999, background:C.green, animation:"pulse 1.5s infinite" }}/>
                    <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:c, textTransform:"uppercase" }}>Applied · Option {String.fromCharCode(65+appliedOption.id)} · {appliedOption.label}</span>
                  </div>
                  {/* <div style={{ fontFamily:DISP, fontWeight:600, fontSize:24, color:C.ink, letterSpacing:"-.01em" }}>Impact on deal economics — <span style={{ fontStyle:"italic", color:c }}>visualised</span> below.</div> */}
                  <div style={{ fontSize:12.5, color:C.muted, marginTop:6 }}>
                    <strong style={{ color:c }}>+${Math.round(appliedOption.rev_lift)}M FY26 revenue</strong> · <strong style={{ color:c }}>+{Math.round(appliedOption.margin_lift_bps)}bps margin</strong> · {appliedOption.affected_packets} packets recomputed · {appliedOption.confidence}
                  </div>
                </div>
                <Btn kind="ghost" small onClick={() => { setSimState("results"); setScreen(screen === "abm-results" ? "abm-workbench" : "deal-workbench"); }}>← Change option</Btn>
              </div>

              {/* Effectiveness charts — Margin Realization + Profit Trajectory */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 24px", boxShadow:T.shadow1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ width:14, height:1, background:T.goldFoil }} />
                    <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Margin Realization recovery</div>
                  </div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:C.ink, letterSpacing:"-.01em", marginBottom:4 }}>Realization trajectory · Q3 '26 → Q2 '27</div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:14 }}>Solid gold = current (84%). Dashed = with Option {String.fromCharCode(65+appliedOption.id)} → {Math.round(q2_27)}% by Q2 '27.</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top:10, right:30, bottom:5, left:10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.line}/>
                      <XAxis dataKey="q" tick={{ fontSize:9, fill:C.muted }} padding={{ left:10, right:10 }}/>
                      <YAxis tick={{ fontSize:9, fill:C.muted }} tickFormatter={v=>`${v}%`} domain={[70, 95]}/>
                      <Line type="monotone" dataKey="plan" name="Plan (90% target)" stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 3" dot={{ r:2, fill:C.muted }}/>
                      <Line type="monotone" dataKey="actual" name="Actual" stroke={C.gold} strokeWidth={2.5} dot={{ r:3, fill:C.gold }} connectNulls={false}/>
                      <Line type="monotone" dataKey="applied" name="With applied option" stroke={C.goldDk} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r:4, fill:C.goldDk }} connectNulls={false}/>
                      <Tooltip formatter={(v)=>v?[`${v}%`]:["—"]} contentStyle={{ borderRadius:T.radSm, border:`1px solid ${C.line2}`, fontSize:12 }}/>
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize:10, color:C.faint, marginTop:8 }}>Gap to 90% target closing · {appliedOption.id===0?"fastest recovery via tightest guardrails":appliedOption.id===1?"balanced recovery + AutoZone resolution":"share captured at margin cost"}</div>
                </div>

                {(() => {
                  const profitLift = appliedOption.profit_lift || Math.round(appliedOption.rev_lift * 0.4);
                  const profitData = ["Q2 26","Q3 26","Q4 26","Q1 27","Q2 27"].map((q,i) => ({
                    q, baseline: 810 + i*10, applied: 810 + Math.round(profitLift * [0, 0.15, 0.4, 0.7, 1][i])
                  }));
                  return (
                    <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 24px", boxShadow:T.shadow1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <span style={{ width:14, height:1, background:T.goldFoil }} />
                        <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Enterprise modeled profit · trajectory</div>
                      </div>
                      <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:C.ink, letterSpacing:"-.01em", marginBottom:4 }}>Profit trajectory · Q2 '26 → Q2 '27</div>
                      <div style={{ fontSize:11, color:C.muted, marginBottom:14 }}>Baseline (no action) vs with Option {String.fromCharCode(65+appliedOption.id)} applied.</div>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={profitData} margin={{ top:10, right:30, bottom:5, left:10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={C.line}/>
                          <XAxis dataKey="q" tick={{ fontSize:9, fill:C.muted }} padding={{ left:10, right:10 }}/>
                          <YAxis tick={{ fontSize:9, fill:C.muted }} tickFormatter={v=>`$${v}M`} domain={[790, 890]}/>
                          <Line type="monotone" dataKey="baseline" name="Baseline (no action)" stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r:2, fill:C.muted }}/>
                          <Line type="monotone" dataKey="applied" name={`With Option ${String.fromCharCode(65+appliedOption.id)}`} stroke={c} strokeWidth={2.5} dot={{ r:4, fill:c }}/>
                          <Tooltip formatter={(v)=>[`$${v}M`]} contentStyle={{ borderRadius:T.radSm, border:`1px solid ${C.line2}`, fontSize:12 }}/>
                        </LineChart>
                      </ResponsiveContainer>
                      <div style={{ fontSize:10, color:C.faint, marginTop:8 }}>FY26 profit uplift materializes through {appliedOption.id===0?"margin protection on existing volume":appliedOption.id===1?"balanced volume + margin pricing":"new-logo wins at thinner margins"}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Timeline */}
              <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"24px 28px", boxShadow:T.shadow1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <span style={{ width:14, height:1, background:T.goldFoil }} />
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase" }}>Timeline · Impact Materialisation</div>
                </div>
                <div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:C.ink, letterSpacing:"-.01em", marginBottom:4 }}>When the deal economics will respond.</div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:24 }}>Phased guardrail rollout — committee approval → packet re-staging → first closed-won at new policy → portfolio-wide margin lift → steady state.</div>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"absolute", left:20, right:20, top:20, height:2, background:`linear-gradient(90deg, ${C.line} 0%, ${C.goldDk} 50%, ${C.green} 100%)` }}/>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, position:"relative" }}>
                    {timeline.map((m,i) => (
                      <div key={i} style={{ textAlign:"center" }}>
                        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
                          <div style={{ width:40, height:40, borderRadius:999, display:"grid", placeItems:"center", background:C.card, border:`2px solid ${m.color}`, fontSize:11, fontWeight:600, color:m.color, fontFamily:DISP, boxShadow:T.shadow1 }}>{i+1}</div>
                        </div>
                        <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:3 }}>{m.q}</div>
                        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:m.color, marginBottom:3 }}>{m.phase}</div>
                        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:17, color:m.color, marginBottom:8 }}>{m.impact}</div>
                        <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{m.lever}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Effectiveness by deal motion */}
              <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 24px", boxShadow:T.shadow1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:16 }}>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:C.ink }}>Effectiveness by deal motion</div>
                  <div style={{ fontSize:10.5, color:C.faint }}>4 sales workstreams</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                  {[
                    { motion:"Renewal", packets:64, bpsFactor:0.9, note:"Strongest margin recovery across existing base" },
                    { motion:"Retention", packets:38, bpsFactor:0.7, note:"At-risk accounts show early stabilization" },
                    { motion:"Penetration", packets:51, bpsFactor:0.5, note:"Cross-sell uplift within current portfolio" },
                    { motion:"New Logo", packets:34, bpsFactor:0.3, note: appliedOption.id===0 ? "Conservative acquisition ceiling" : appliedOption.id===1 ? "Balanced new-logo margin floor" : "Aggressive acquisition with higher ceiling" },
                  ].map((w,i) => (
                    <div key={i} style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.rad, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:c, opacity:.4 }} />
                      <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".18em", color:C.muted, textTransform:"uppercase", marginBottom:6, marginTop:2 }}>{w.motion}</div>
                      <div style={{ fontSize:11, color:C.faint, marginBottom:8 }}>{w.packets} packets</div>
                      <div style={{ fontFamily:DISP, fontWeight:600, fontSize:22, color:c, letterSpacing:"-.02em", marginBottom:6 }}>+{Math.round(appliedOption.margin_lift_bps * w.bpsFactor)}bps</div>
                      <div style={{ fontSize:10.5, color:C.muted, lineHeight:1.5 }}>{w.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact summary cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:c, opacity:.55 }} />
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:8, marginTop:2 }}>FY26 Revenue Lift</div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:26, color:c, letterSpacing:"-.02em" }}>+${Math.round(appliedOption.rev_lift)}M</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Across {appliedOption.affected_packets} re-staged packets</div>
                </div>
                <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:c, opacity:.55 }} />
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:8, marginTop:2 }}>Margin Uplift</div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:26, color:c, letterSpacing:"-.02em" }}>+{Math.round(appliedOption.margin_lift_bps)}bps</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Ent. op. margin → {(liveOutcomes.margin + appliedOption.margin_lift_bps/100).toFixed(1)}%</div>
                </div>
                <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:appliedOption.leakage_change<0?C.green:C.red, opacity:.55 }} />
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:8, marginTop:2 }}>Discount Leakage</div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:26, color:appliedOption.leakage_change<0?C.green:C.red, letterSpacing:"-.02em" }}>{appliedOption.leakage_change>0?"+":""}${appliedOption.leakage_change}M</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{appliedOption.leakage_change<0?"Tighter ceilings reduce leakage":"Permissive policy widens leakage"}</div>
                </div>
                <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"18px 20px", boxShadow:T.shadow1, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:appliedOption.id===0?C.red:C.green, opacity:.55 }} />
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".22em", color:C.muted, textTransform:"uppercase", marginBottom:8, marginTop:2 }}>AutoZone Packet</div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:appliedOption.id===0?C.red:C.green, marginTop:4 }}>{appliedOption.id===0?"Override blocked · re-stage":"Override path resolved ✓"}</div>
                  <div style={{ fontSize:10.5, color:C.faint, marginTop:6 }}>{appliedOption.id===0?"S3 still breaches L2 ceiling":appliedOption.id===1?"Single-use override":"Normal approval path"}</div>
                </div>
              </div>

              {/* Save / route */}
              <div style={{ background:T.cardElevated, border:`1px solid ${C.gold}44`, borderRadius:T.radLg, padding:"22px 26px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.shadowGoldGlow, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:T.goldFoil }} />
                <div>
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".24em", color:C.goldDk, textTransform:"uppercase", marginBottom:4 }}>Ready to Route</div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:C.ink, lineHeight:1.4 }}>Stage this as a policy directive. Routes through {governance.length > 0 ? governance.join(" + ") : "committee"} for sign-off, then cascades into the Deal Analyser tool.</div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <Btn kind="ghost" small disabled={savingEntInitiative} onClick={async () => {
                    setSavingEntInitiative(true);
                    try {
                      await saveSimulationAsMemory({
                        simulation_title: `Guardrail directive · Option ${String.fromCharCode(65 + appliedOption.id)} · ${appliedOption.label}`,
                        simulation_summary: `${appliedOption.tag}. Profit lift: $${appliedOption.profit_lift}M. Margin: +${appliedOption.margin_lift_bps}bps. Key moves: ${appliedOption.key_moves.join("; ")}. ${appliedOption.confidence}. Affected packets: ${appliedOption.affected_packets}.`,
                        simulation_type: "enterprise",
                        query: `Enterprise Deal Analyser guardrail simulation`,
                        levers: appliedOption.key_moves,
                        metrics: [
                          { label: "Profit Lift", value: `$${appliedOption.profit_lift}M` },
                          { label: "Margin Lift", value: `+${appliedOption.margin_lift_bps}bps` },
                          { label: "Affected Packets", value: `${appliedOption.affected_packets}` },
                        ],
                        recommendations: appliedOption.key_moves,
                      });
                      toast.push({ tone:"success", title:"Saved to Memory", body:`Guardrail directive saved as in-motion initiative in Memory.` });
                    } catch (e) {
                      toast.push({ tone:"error", title:"Save failed", body: e.message });
                    } finally {
                      setSavingEntInitiative(false);
                    }
                  }}>{savingEntInitiative ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> Saving...</> : "Save as initiative"}</Btn>
                  {onCreateBrief && <Btn kind="gold" onClick={() => onCreateBrief({
                    context_type: "simulation",
                    context_data: {
                      verdict: `Guardrail directive · ${appliedOption.label}: $${appliedOption.profit_lift}M profit lift, +${appliedOption.margin_lift_bps}bps margin. ${appliedOption.tag}. ${appliedOption.confidence}. Affected packets: ${appliedOption.affected_packets}.`,
                      key_metrics: [{ label: "Profit Lift", value: `$${appliedOption.profit_lift}M` }, { label: "Margin Lift", value: `+${appliedOption.margin_lift_bps}bps` }, { label: "Affected Packets", value: `${appliedOption.affected_packets}` }],
                      recommendations: appliedOption.key_moves,
                      query: "Enterprise Deal Analyser guardrail simulation",
                      levers: appliedOption.key_moves,
                    },
                    pushMembers: [
                      { name: "VP Revenue Management", role: "R. Patel (guardrail authority, L1 cap change approval)" },
                      { name: "Analyst T. Whitaker", role: "AutoZone Packet 10941 (direct author of the override request)" },
                      { name: "VP Enterprise Sales", role: "AutoZone relationship owner" },
                      { name: "CFO / Finance", role: "L1 cap tightening financial impact sign-off ($36M recovery)" },
                      { name: "Pricing Committee", role: "For formal L2 override approval" },
                    ],
                  })}><FileEdit size={13} /> Create Alignment Brief</Btn>}
                  {/* <Btn kind="ghost" onClick={() => setScreen("ent-initiatives")}>View all initiatives →</Btn> */}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Enterprise Push to Subordinate Modal */}
        {showEntPushModal && appliedOption && (() => {
          const entPushMembers = [
            { name: "VP Revenue Management", role: "R. Patel (guardrail authority, L1 cap change approval)" },
            { name: "Analyst T. Whitaker", role: "AutoZone Packet 10941 (direct author of the override request)" },
            { name: "VP Enterprise Sales", role: "AutoZone relationship owner (is S2 bundle still on the table?)" },
            { name: "CFO / Finance", role: "L1 cap tightening financial impact sign-off ($36M recovery)" },
            { name: "Pricing Committee", role: "For formal L2 override approval on AutoZone if S3 is chosen" },
          ];
          const entPushCount = entPushChecked.filter(Boolean).length;
          return (
          <div style={{ position:"fixed", inset:0, zIndex:9999, display:"grid", placeItems:"center", background:"rgba(10,22,40,.55)", backdropFilter:"blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowEntPushModal(false); }}>
            <style>{`
              .ent-push-modal-scroll::-webkit-scrollbar { width: 5px; }
              .ent-push-modal-scroll::-webkit-scrollbar-track { background: transparent; }
              .ent-push-modal-scroll::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 10px; }
              .ent-push-modal-scroll::-webkit-scrollbar-thumb:hover { background: ${C.muted}; }
            `}</style>
            <div className="ent-push-modal-scroll" style={{ background:C.card, borderRadius:T.radLg, padding:"32px 36px", maxWidth:640, width:"90%", boxShadow:"0 24px 64px rgba(0,0,0,.25)", position:"relative", maxHeight:"85vh", overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:`${C.line} transparent` }}>
              <button onClick={() => setShowEntPushModal(false)} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:18 }}>✕</button>

              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ width:18, height:1, background:T.goldFoil }} />
                <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Working Group</span>
              </div>
              <div style={{ fontFamily:DISP, fontWeight:600, fontSize:24, color:C.ink, letterSpacing:"-.02em", lineHeight:1.15, marginBottom:4 }}>
                Invite team to investigate — Working Group
              </div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:24, lineHeight:1.5 }}>
                Enterprise Pricing Discipline & AutoZone Save-Play
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div>
                  <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", marginBottom:14 }}>Who to Include ({entPushCount})</div>
                  {entPushMembers.map((mem, mi) => (
                    <div key={mi} onClick={() => { const next = [...entPushChecked]; next[mi] = !next[mi]; setEntPushChecked(next); }}
                      style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", marginBottom:6, cursor:"pointer",
                      background: entPushChecked[mi] ? `${C.gold}08` : "transparent", border:`1px solid ${entPushChecked[mi] ? C.gold+"50" : C.line}`, borderRadius:T.radMd,
                      transition:`all .15s ${T.ease}` }}>
                      <input type="checkbox" checked={entPushChecked[mi]} readOnly style={{ marginTop:2, accentColor:C.gold, width:15, height:15, cursor:"pointer" }} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color: entPushChecked[mi] ? C.ink : C.muted, lineHeight:1.3 }}>{mem.name}</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:2, lineHeight:1.4 }}>{mem.role}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", marginBottom:14 }}>Share Preview</div>
                  <div style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"16px 18px", marginBottom:16 }}>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:C.ink, marginBottom:8 }}>AutoZone Packet 10941 Requires Your Sign-Off — And a Guardrail Change Could Recover $36M</div>
                    <div style={{ fontSize:12, color:C.ink2, lineHeight:1.6, marginBottom:10 }}>
                      Two pricing decisions · AutoZone override + L1 cap tightening · $36M recovery
                    </div>
                    {[
                      { label: "In-Flight Packets", val: "187", neg: false },
                      { label: "Margin Realization", val: "84%", neg: false },
                      { label: "Leakage Source", val: "L1 Accessorial", neg: true },
                    ].map((k, ki) => (
                      <div key={ki} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderTop:`1px solid ${C.line}` }}>
                        <span style={{ fontSize:11, color:C.muted }}>{k.label}</span>
                        <span style={{ fontSize:12, fontWeight:600, color: k.neg ? C.red : C.ink, fontFamily:DISP }}>{k.val}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.goldDk, fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Key Supporting Questions</div>
                  {[
                    "Is the AutoZone S2 bundle still viable, or has the relationship shifted to a pure-price negotiation?",
                    "What is the expected margin impact if we tighten L1 accessorial caps across all 187 in-flight packets?",
                  ].map((q, qi) => (
                    <div key={qi} style={{ fontSize:12, color:C.ink2, lineHeight:1.5, padding:"8px 0", borderBottom:`1px solid ${C.line}08`, display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ color:C.gold, flexShrink:0, marginTop:2 }}>?</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop:24, display:"flex", justifyContent:"center" }}>
                {entPushSent ? (
                  <div style={{ background:`${C.green}0C`, border:`1px solid ${C.green}40`, borderRadius:T.radLg, padding:"20px 24px", display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>
                    <div style={{ fontSize:9.5, letterSpacing:".22em", color:C.green, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Working Group Started</div>
                    <div style={{ fontSize:13, color:C.ink, fontWeight:600, marginBottom:6 }}>Invitations sent to {entPushCount} team member{entPushCount !== 1 ? "s" : ""}.</div>
                    <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>They'll receive the share preview, guardrail configuration, and execution questions.</div>
                  </div>
                ) : (
                  <button onClick={() => { setEntPushSent(true); saveInitiative("pending-approval"); }} disabled={entPushCount === 0}
                    style={{ padding:"10px 22px", borderRadius:T.radPill, background: entPushCount > 0 ? T.goldFoil : C.line, color: entPushCount > 0 ? "#0A1628" : C.muted, border:"none", cursor: entPushCount > 0 ? "pointer" : "not-allowed",
                      fontFamily:FONT, fontWeight:700, fontSize:11.5, letterSpacing:".05em", textTransform:"uppercase",
                      boxShadow: entPushCount > 0 ? T.shadowGoldGlow : "none", transition:`all .15s ${T.ease}`, display:"flex", alignItems:"center", gap:7 }}
                    onMouseEnter={e => { if (entPushCount > 0) e.currentTarget.style.transform = "scale(1.02)"; }}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                    Push to Field Team ({entPushCount})
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    );
  };

  /* ---- SCREEN: ENTERPRISE INITIATIVES & DECISIONS LOG ---- */
  const renderEntInitiatives = () => {
    const [iniFilter, setIniFilter] = useState("all");
    const filtered = iniFilter === "all" ? ENT_INITIATIVES : ENT_INITIATIVES.filter(i => i.status === iniFilter);
    const stats = {
      total: ENT_INITIATIVES.length,
      completed: ENT_INITIATIVES.filter(i => i.status === "completed").length,
      inExecution: ENT_INITIATIVES.filter(i => i.status === "in-execution").length,
      pending: ENT_INITIATIVES.filter(i => i.status === "pending-approval").length,
      totalProfit: ENT_INITIATIVES.reduce((s,i) => s + (i.actualProfit || 0), 0),
      totalModeledProfit: ENT_INITIATIVES.reduce((s,i) => s + (i.modeledProfit || 0), 0),
    };
    const statusMeta = {
      "completed": { color:C.green, label:"Completed", bg:`${C.green}15` },
      "in-execution": { color:C.goldDk, label:"In execution", bg:`${C.gold}15` },
      "pending-approval": { color:C.amber, label:"Pending approval", bg:`${C.amber}15` },
    };

    return (
      <div>
        {/* <Breadcrumb items={[{label:"Executive Home", onClick:onBack},{label:"Decision Lab", onClick:onBack},{label:"Enterprise Snapshot", onClick:()=>setScreen("ent-snapshot")},{label:"Initiatives & Decisions Log"}]} /> */}

        <SH kicker="Enterprise decisions log"
          title="Past pricing interventions, their outcomes, and what landed."
          sub="Every CCO guardrail change, every override approval, every scenario rigor mandate — captured as a tracked policy initiative. Outcomes flow back into the model so the next intervention is better-informed."
          right={<div style={{display:"flex",gap:6}}><TagChip tone="green">{stats.completed} completed</TagChip><TagChip tone="amber">{stats.inExecution} in flight</TagChip>{stats.pending>0&&<TagChip tone="brick">{stats.pending} pending</TagChip>}</div>} />

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
          <KCard label="Active + completed" value={String(stats.completed + stats.inExecution + stats.pending)} delta="" deltaLabel={`${stats.completed} completed · ${stats.inExecution} in flight · ${stats.pending} pending`} status="ok" />
          <KCard label="Profit impact · realized" value={`+$${stats.totalProfit}M`} delta="" deltaLabel={`vs $${stats.totalModeledProfit}M modeled · ${Math.round(stats.totalProfit/stats.totalModeledProfit*100)}% realization`} status="ok" />
          <KCard label="Highest-impact lever" value="L1 Accessorial ceiling" delta="" deltaLabel="+$42M actual · #1 leakage source recovered" status="ok" />
          <KCard label="Pending CFO sign-off" value={String(stats.pending)} delta="" deltaLabel="AutoZone single-use override" status={stats.pending>0?"warn":"ok"} />
        </div>

        <div style={{ display:"flex", gap:6, marginBottom:18 }}>
          {[{k:"all",l:`All (${stats.total})`},{k:"completed",l:`Completed (${stats.completed})`},{k:"in-execution",l:`In execution (${stats.inExecution})`},{k:"pending-approval",l:`Pending (${stats.pending})`}].map(f => (
            <button key={f.k} onClick={() => setIniFilter(f.k)}
              style={{ fontSize:11, fontWeight:iniFilter===f.k?700:500, padding:"7px 14px", borderRadius:T.radPill, border:`1px solid ${iniFilter===f.k?C.gold:C.line}`, background:iniFilter===f.k?`${C.gold}10`:C.card, color:iniFilter===f.k?C.goldDk:C.muted, cursor:"pointer", fontFamily:FONT, letterSpacing:".06em" }}>
              {f.l}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:24 }}>
          {filtered.map(ini => {
            const sm = statusMeta[ini.status] || statusMeta["in-execution"];
            const variance = ini.modeledProfit > 0 ? ((ini.actualProfit - ini.modeledProfit) / ini.modeledProfit * 100).toFixed(0) : "—";
            const variancePositive = ini.actualProfit > ini.modeledProfit;
            return (
              <div key={ini.id} style={{ background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg, padding:"22px 24px", boxShadow:T.shadow1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:T.radPill, background:sm.bg, color:sm.color, letterSpacing:".1em", textTransform:"uppercase" }}>{sm.label}</span>
                      <span style={{ fontSize:10, color:C.faint }}>{ini.id}</span>
                      <span style={{ fontSize:10, color:C.muted }}>· {ini.scope}</span>
                      {ini.affectedPackets > 0 && <span style={{ fontSize:10, color:C.muted }}>· {ini.affectedPackets} packets</span>}
                    </div>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:17, color:C.ink, letterSpacing:"-.005em", lineHeight:1.2 }}>{ini.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:6, lineHeight:1.5 }}>{ini.notes}</div>
                  </div>
                  <div style={{ textAlign:"right", marginLeft:16, flexShrink:0 }}>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.muted, textTransform:"uppercase", marginBottom:4 }}>{ini.stage}</div>
                    <div style={{ fontSize:10, color:C.faint }}>{ini.owner}</div>
                  </div>
                </div>

                <div style={{ borderTop:`1px solid ${C.line}`, paddingTop:14, display:"grid", gridTemplateColumns:"repeat(4,1fr) 2fr", gap:16 }}>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>Profit · modeled</div>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:C.ink }}>+${ini.modeledProfit}M</div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>Profit · actual</div>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:ini.actualProfit > 0 ? (variancePositive ? C.green : C.amber) : C.muted }}>{ini.actualProfit > 0 ? `+$${ini.actualProfit}M` : "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>Margin · realized</div>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:C.ink }}>{ini.actualMargin > 0 ? `+${ini.actualMargin.toFixed(1)}pp` : "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>Variance · vs model</div>
                    <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:ini.status === "completed" ? (variancePositive ? C.green : C.red) : C.muted }}>{variance !== "—" ? `${variancePositive ? "+" : ""}${variance}%` : "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", color:C.faint, textTransform:"uppercase", marginBottom:4 }}>Levers deployed</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {ini.levers.map((l,j) => <span key={j} style={{ fontSize:10, padding:"3px 8px", borderRadius:T.radSm, background:C.line, color:C.muted, fontFamily:FONT }}>{l}</span>)}
                    </div>
                  </div>
                </div>

                {(ini.whatWorked || ini.whatDidntWork || ini.lessonLearned) && (
                  <div style={{ borderTop:`1px solid ${C.line}`, paddingTop:14, marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                    <div style={{ background:`${C.green}06`, border:`1px solid ${C.green}25`, borderRadius:T.radMd, padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                        <span style={{ color:C.green }}>✓</span>
                        <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.green, textTransform:"uppercase" }}>What worked</div>
                      </div>
                      <div style={{ fontSize:11, color:C.ink2, lineHeight:1.5 }}>{ini.whatWorked}</div>
                    </div>
                    <div style={{ background:`${C.amber}06`, border:`1px solid ${C.amber}25`, borderRadius:T.radMd, padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                        <span style={{ color:C.amber }}>✕</span>
                        <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.amber, textTransform:"uppercase" }}>What didn't work</div>
                      </div>
                      <div style={{ fontSize:11, color:C.ink2, lineHeight:1.5 }}>{ini.whatDidntWork}</div>
                    </div>
                    <div style={{ background:`${C.gold}06`, border:`1px solid ${C.gold}25`, borderRadius:T.radMd, padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                        <span style={{ color:C.goldDk }}>★</span>
                        <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:C.goldDk, textTransform:"uppercase" }}>For next time</div>
                      </div>
                      <div style={{ fontSize:11, color:C.ink2, lineHeight:1.5 }}>{ini.lessonLearned}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ background:`${C.gold}06`, border:`1.5px solid ${C.gold}25`, borderRadius:T.radLg, padding:"22px 26px" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", color:C.goldDk, textTransform:"uppercase", marginBottom:8 }}>What the data says</div>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, margin:0 }}>
            Across the 5 initiatives, <span style={{ color:C.goldDk, fontWeight:600 }}>L1 Accessorial ceiling tightening</span> produced the largest realized profit (+$42M vs +$36M modeled, 117% realization). L2 Tier ceiling policy is structurally sound but escalation latency cost ≈$8M in withdrawn bids. Senior analyst overlay shows strong leading indicators (+3.1pp win rate). The AutoZone override pending decision should reference the O'Reilly 2024 pattern — pair with peak-season SLA.
          </p>
        </div>
      </div>
    );
  };

  // ---- TOP-LEVEL: 3-step stepper + render active screen ----
  const screenOrder = ["ent-snapshot","da-snapshot","deal-workbench","results"];
  const screenLabels = { "ent-snapshot":"Enterprise Snapshot", "da-snapshot":"Deal Analyzer Snapshot", "deal-workbench":"Deal Workbench", "results":"Outcomes" };
  const screenIcons = { "ent-snapshot":Eye, "da-snapshot":Target, "deal-workbench":Activity, "results":BarChart3 };

  return (
    <div>
      {onBack && (
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:C.brandLt, fontSize:13, fontWeight:600, fontFamily:FONT }}>
            <ChevronLeft size={16}/> Decision Lab
          </button>
          <span style={{ color:C.faint, fontSize:12 }}>/</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>Digital Deal Analyser for Enterprise</span>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, marginBottom:32, background:C.card, border:`1px solid ${C.line}`, borderRadius:14, padding:"18px 28px", boxShadow:T.shadow2 }}>
        {screenOrder.map((s, i) => {
          const Icon = screenIcons[s];
          const curIdx = screenOrder.indexOf(screen);
          const sIdx = i;
          const done = sIdx < curIdx, active = s === screen;
          return (
            <React.Fragment key={s}>
              {i > 0 && <div style={{ width:56, height:2, background:done?C.green:active?C.gold:C.line, margin:"0 4px", borderRadius:2, transition:"background .3s" }}/>}
              <button onClick={() => setScreen(s)}
                style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 18px", borderRadius:10, border:active?`2px solid ${C.gold}`:done?`2px solid ${C.green}44`:`2px solid transparent`, background:active?C.amberBg:done?C.greenBg:"transparent", cursor:"pointer", fontFamily:FONT, transition:`all .25s ${T.ease}` }}>
                <div style={{ width:32, height:32, borderRadius:999, flexShrink:0, background:done?C.green:active?C.gold:C.line, display:"grid", placeItems:"center" }}>
                  {done ? <Check size={16} color="#fff" strokeWidth={3}/> : <Icon size={15} color={active?C.brand:C.faint}/>}
                </div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:10, letterSpacing:".08em", color:done?C.green:active?C.goldDk:C.faint, fontWeight:700 }}>STEP {i+1}</div>
                  <div style={{ fontSize:13, fontWeight:active?700:500, color:active?C.ink:done?C.ink2:C.muted, whiteSpace:"nowrap" }}>{screenLabels[s]}</div>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {screen === "ent-snapshot" && renderEntSnapshot()}
      {screen === "da-snapshot" && renderDASnapshot()}
      {(screen === "deal-workbench" || screen === "results") && renderDealWorkbench()}
      {screen === "ent-initiatives" && renderEntInitiatives()}
    </div>
  );
}

/* ------------------------------------------------------------------ WARGAME DEEP VIEW */
function WargameDeepView({ onBack, onCreateBrief }) {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState("intel");
  const [wgSim, setWgSim] = useState(null);
  const [wgBusy, setWgBusy] = useState(false);
  const [ourPricing, setOurPricing] = useState(50);
  const [ourInnov, setOurInnov] = useState(50);
  const [theirPricing, setTheirPricing] = useState(50);
  const [theirInnov, setTheirInnov] = useState(50);

  useEffect(() => {
    fetchWargameCompetitors().then(d => { setCompetitors(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:"center", padding:80, color:C.muted }}>Loading competitors...</div>;
  if (!competitors.length) return <div style={{ textAlign:"center", padding:80, color:C.muted }}>No competitor data available.</div>;

  const c = competitors[sel];
  const parseShare = (s) => { const n = parseFloat((s || "").replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; };

  const runSim = async () => {
    setWgBusy(true);
    try {
      const result = await fetchWargameSim({
        competitor_id: c.id,
        our_pricing: ourPricing,
        our_innovation: ourInnov,
        their_pricing: theirPricing,
        their_innovation: theirInnov,
        runs: 1000,
      });
      setWgSim(result);
    } catch (e) {
      console.error("Wargame simulation error:", e);
    }
    setWgBusy(false);
  };

  const threatColor = (level) => level === "HIGH" ? C.red : level === "MEDIUM" ? C.amber : C.green;

  return (
    <div>
      {/* Back + Title */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:C.ink2, display:"flex", alignItems:"center", gap:6, fontSize:12.5, fontFamily:FONT, fontWeight:500, padding:0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ width:1, height:20, background:C.line2 }} />
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:`${C.red}12`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Swords size={16} color={C.red} />
          </div>
          <div>
            <div style={{ fontFamily:DISP, fontWeight:600, fontSize:20, color:C.ink, letterSpacing:"-.01em" }}>Competitive Wargame</div>
            <div style={{ fontSize:11, color:C.muted }}>Monte Carlo battle simulation · {competitors.length} competitors</div>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:24, alignItems:"start" }}>
        {/* LEFT: Competitor Selector */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".2em", color:C.faint, textTransform:"uppercase", paddingLeft:4, marginBottom:4 }}>Select Competitor</div>
          {competitors.map((comp, i) => {
            const isSel = sel === i;
            const shareVal = parseShare(comp.market_share);
            return (
              <div key={comp.id} onClick={() => { setSel(i); setWgSim(null); setTab("intel"); }}
                style={{ padding:14, borderRadius:T.radMd, cursor:"pointer", background:isSel ? `${threatColor(comp.threat_level)}08` : C.card,
                  border:`1px solid ${isSel ? threatColor(comp.threat_level) : C.line}`, boxShadow:isSel ? `0 4px 16px ${threatColor(comp.threat_level)}12` : "none",
                  transition:`all .2s ${T.ease}`, position:"relative", overflow:"hidden" }}>
                {isSel && <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:threatColor(comp.threat_level) }} />}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:14, color:isSel ? C.ink : C.muted }}>{comp.name}</div>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", padding:"2px 6px", borderRadius:999, background:`${threatColor(comp.threat_level)}15`, color:threatColor(comp.threat_level) }}>{comp.threat_level}</span>
                </div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>{comp.market_share} market share</div>
                <div style={{ height:4, width:"100%", background:C.line, borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${shareVal}%`, background:isSel ? threatColor(comp.threat_level) : C.muted, opacity:isSel ? 1 : 0.4, transition:`width .8s ${T.ease}` }} />
                </div>
                <div style={{ fontSize:9, fontWeight:700, color:C.faint, letterSpacing:".1em", textTransform:"uppercase", marginTop:6 }}>{comp.tier} — {comp.threat_level === "HIGH" ? "PRIMARY" : "SECONDARY"}</div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Detail Area */}
        <div>
          {/* Tabs */}
          <div style={{ display:"flex", gap:0, marginBottom:20, background:C.panel || C.paper, borderRadius:T.radMd, padding:4, border:`1px solid ${C.line}`, width:"fit-content" }}>
            {[{id:"intel",l:"Intelligence",icon:Eye},{id:"simulate",l:"Simulate Battle",icon:Swords},{id:"scenarios",l:"Threat Scenarios",icon:AlertTriangle}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:T.radSm, border:"none",
                  background:tab===t.id ? C.card : "transparent", color:tab===t.id ? C.ink : C.muted,
                  fontSize:11.5, fontWeight:tab===t.id ? 700 : 500, cursor:"pointer", fontFamily:FONT,
                  boxShadow:tab===t.id ? T.shadow1 : "none", transition:`all .2s ${T.ease}` }}>
                <t.icon size={13} color={tab===t.id ? C.red : C.muted} />
                {t.l}
              </button>
            ))}
          </div>

          {/* INTEL TAB */}
          {tab === "intel" && (
            <div style={{ animation:`fadeIn .3s ease` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:28, color:C.ink, letterSpacing:"-.02em", marginBottom:4 }}>vs {c.name}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:C.muted }}>
                    <span>{c.market_share} market share</span>
                    <div style={{ width:4, height:4, borderRadius:"50%", background:C.line2 }} />
                    <span>{c.tier}</span>
                  </div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", padding:"4px 10px", borderRadius:999, background:`${threatColor(c.threat_level)}15`, color:threatColor(c.threat_level) }}>{c.threat_level} THREAT</span>
              </div>

              <div style={{ fontSize:14, color:C.muted, lineHeight:1.65, marginBottom:28, maxWidth:"90%" }}>{c.positioning}</div>

              {/* Strengths & Weaknesses */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, marginBottom:28 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:C.green, letterSpacing:".18em", textTransform:"uppercase", marginBottom:14 }}>Strengths</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {(c.strengths || []).map((s, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                        <span style={{ color:C.green, fontWeight:800, fontSize:15, marginTop:-1, flexShrink:0 }}>+</span>
                        <span style={{ fontSize:13, color:C.ink, lineHeight:1.45 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:C.red, letterSpacing:".18em", textTransform:"uppercase", marginBottom:14 }}>Weaknesses</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {(c.weaknesses || []).map((w, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                        <span style={{ color:C.red, fontWeight:800, fontSize:15, marginTop:-1, flexShrink:0 }}>−</span>
                        <span style={{ fontSize:13, color:C.ink, lineHeight:1.45 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Moves */}
              <div style={{ background:C.card, borderRadius:T.radMd, border:`1px solid ${C.line}`, padding:20 }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.faint, letterSpacing:".18em", textTransform:"uppercase", marginBottom:14 }}>Recent Moves</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {(c.recent_moves || []).map((m, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:T.radSm, background:`${C.red}04`, border:`1px solid ${C.line}` }}>
                      <ChevronRight size={13} color={C.red} style={{ flexShrink:0 }} />
                      <span style={{ fontSize:13, color:C.ink, lineHeight:1.4 }}>{typeof m === "object" ? m.move || m.title : m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SIMULATE TAB */}
          {tab === "simulate" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {/* Controls */}
              <div style={{ background:C.card, borderRadius:T.radMd, border:`1px solid ${C.line}`, padding:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:14, fontFamily:DISP }}>Our Moves (UPS)</div>
                {[{label:"Pricing Aggression", value:ourPricing, set:setOurPricing, color:C.green, desc:"How aggressively we compete on RPP"},
                  {label:"Service Innovation", value:ourInnov, set:setOurInnov, color:C.goldDk, desc:"New capabilities, technology, service tiers"}].map(l => (
                  <div key={l.label} style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, color:C.muted }}>{l.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:l.color }}>{l.value < 40 ? "Conservative" : l.value < 60 ? "Moderate" : "Aggressive"}</span>
                    </div>
                    <input type="range" min={10} max={90} value={l.value} onChange={e => l.set(+e.target.value)}
                      style={{ width:"100%", accentColor:l.color }} />
                    <div style={{ fontSize:10, color:C.faint, marginTop:2 }}>{l.desc}</div>
                  </div>
                ))}

                <div style={{ borderTop:`1px solid ${C.line}`, paddingTop:14, marginTop:4 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.red, marginBottom:14, fontFamily:DISP }}>Their Moves ({c.name})</div>
                  {[{label:"Their Pricing", value:theirPricing, set:setTheirPricing, color:C.red, desc:"How aggressively they respond on price"},
                    {label:"Their Innovation", value:theirInnov, set:setTheirInnov, color:C.amber, desc:"New product threats and capabilities"}].map(l => (
                    <div key={l.label} style={{ marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:12, color:C.muted }}>{l.label}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:l.color }}>{l.value < 40 ? "Conservative" : l.value < 60 ? "Moderate" : "Aggressive"}</span>
                      </div>
                      <input type="range" min={10} max={90} value={l.value} onChange={e => l.set(+e.target.value)}
                        style={{ width:"100%", accentColor:l.color }} />
                    </div>
                  ))}
                </div>

                <button onClick={runSim} disabled={wgBusy}
                  style={{ width:"100%", padding:"11px 0", borderRadius:T.radSm, border:"none", cursor:wgBusy ? "default" : "pointer",
                    background:`linear-gradient(135deg,${C.red},${C.amber})`, color:"#fff", fontSize:12, fontWeight:700,
                    fontFamily:FONT, letterSpacing:".02em", marginTop:4, opacity:wgBusy ? 0.6 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {wgBusy ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> Running 1,000 battles...</> : <><Swords size={13} /> Simulate vs {c.name}</>}
                </button>
              </div>

              {/* Results */}
              <div>
                {!wgSim && !wgBusy && (
                  <div style={{ background:C.card, borderRadius:T.radMd, border:`1px solid ${C.line}`, padding:50, textAlign:"center" }}>
                    <Swords size={28} color={C.red} style={{ opacity:0.2, marginBottom:10 }} />
                    <div style={{ fontSize:14, fontWeight:600, color:C.muted, fontFamily:DISP }}>Set the battle conditions and run</div>
                    <div style={{ fontSize:12, color:C.faint, marginTop:6 }}>Model how market share shifts under different competitive scenarios</div>
                  </div>
                )}

                {wgBusy && (
                  <div style={{ animation:"fadeIn .3s ease-out" }}>
                    <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:20, marginBottom:10, textAlign:"center", animation:"pulse 1.5s infinite" }}>
                      <div style={{ height:10, width:80, background:C.line, borderRadius:4, margin:"0 auto 12px" }} />
                      <div style={{ height:32, width:100, background:C.line, borderRadius:8, margin:"0 auto 8px" }} />
                      <div style={{ height:10, width:120, background:C.line, borderRadius:4, margin:"0 auto" }} />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                      {[0,1].map(i => (
                        <div key={i} style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:16, animation:"pulse 1.5s infinite", animationDelay:`${i*0.1}s` }}>
                          <div style={{ height:10, width:60, background:C.line, borderRadius:4, marginBottom:8 }} />
                          <div style={{ height:22, width:50, background:C.line, borderRadius:4, marginBottom:8 }} />
                          <div style={{ height:8, width:80, background:C.line, borderRadius:4 }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:T.radMd, padding:16, animation:"pulse 1.5s infinite", animationDelay:"0.3s" }}>
                      <div style={{ height:12, width:"100%", background:C.line, borderRadius:4, marginBottom:8 }} />
                      <div style={{ height:12, width:"90%", background:C.line, borderRadius:4, marginBottom:8 }} />
                      <div style={{ height:12, width:"95%", background:C.line, borderRadius:4 }} />
                    </div>
                  </div>
                )}

                {wgSim && !wgBusy && (<>
                  {/* Win Rate */}
                  <div style={{ background:wgSim.winRate > 60 ? `${C.green}08` : wgSim.winRate > 40 ? `${C.goldDk}08` : `${C.red}08`,
                    border:`1px solid ${(wgSim.winRate > 60 ? C.green : wgSim.winRate > 40 ? C.goldDk : C.red)}20`,
                    borderRadius:T.radMd, padding:"14px 18px", marginBottom:10, textAlign:"center" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.faint, letterSpacing:".14em", textTransform:"uppercase" }}>Win Rate vs {c.name}</div>
                    <div style={{ fontFamily:DISP, fontSize:36, fontWeight:600, color:wgSim.winRate > 60 ? C.green : wgSim.winRate > 40 ? C.goldDk : C.red, letterSpacing:"-.02em" }}>{wgSim.winRate}%</div>
                    <div style={{ fontSize:11, color:C.faint }}>{wgSim.runs.toLocaleString()} simulated market battles</div>
                  </div>

                  {/* Share Comparison */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                    <div style={{ background:C.card, borderRadius:T.radMd, border:`1px solid ${C.line}`, padding:14 }}>
                      <div style={{ fontSize:11, color:C.faint, marginBottom:4 }}>UPS Share (Median)</div>
                      <div style={{ fontFamily:DISP, fontSize:24, fontWeight:600, color:C.green }}>{wgSim.ourShare.p50}%</div>
                      <div style={{ fontSize:10, color:C.faint }}>Range: {wgSim.ourShare.p10}% – {wgSim.ourShare.p90}%</div>
                    </div>
                    <div style={{ background:C.card, borderRadius:T.radMd, border:`1px solid ${C.line}`, padding:14 }}>
                      <div style={{ fontSize:11, color:C.faint, marginBottom:4 }}>{c.name} Share (Median)</div>
                      <div style={{ fontFamily:DISP, fontSize:24, fontWeight:600, color:C.red }}>{wgSim.theirShare.p50}%</div>
                      <div style={{ fontSize:10, color:C.faint }}>Range: {wgSim.theirShare.p10}% – {wgSim.theirShare.p90}%</div>
                    </div>
                  </div>

                  {/* Battle Analysis */}
                  {wgSim.battle_analysis && (
                    <div style={{ background:C.card, borderRadius:T.radMd, border:`1px solid ${C.line}`, padding:16 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                        <Sparkles size={12} color={C.goldDk} />
                        <span style={{ fontSize:12, fontWeight:700, color:C.goldDk, fontFamily:DISP }}>Battle Analysis</span>
                      </div>
                      <div style={{ fontSize:13, color:C.ink, lineHeight:1.7 }}>{wgSim.battle_analysis}</div>
                    </div>
                  )}
                  {onCreateBrief && (
                    <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}>
                      <Btn kind="ghost" small onClick={() => onCreateBrief({
                        context_type: "simulation",
                        context_data: { verdict: `Wargame vs ${competitors[sel]?.name || "competitor"}: ${wgSim.winRate}% win rate, UPS share ${wgSim.ourShare.p50}% vs ${wgSim.theirShare.p50}%`, key_metrics: [{ label: "Win Rate", value: `${wgSim.winRate}%` }, { label: "UPS Share", value: `${wgSim.ourShare.p50}%` }, { label: "Competitor Share", value: `${wgSim.theirShare.p50}%` }], recommendations: [], query: `Competitive wargame simulation vs ${competitors[sel]?.name || "competitor"}` }
                      })}><FileEdit size={13} /> Create Alignment Brief</Btn>
                    </div>
                  )}
                </>)}
              </div>
            </div>
          )}

          {/* SCENARIOS TAB */}
          {tab === "scenarios" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12, animation:`fadeIn .3s ease` }}>
              {(c.scenarios || []).map((s, i) => (
                <div key={i} style={{ background:C.card, borderRadius:T.radMd, border:`1px solid ${C.line}`, padding:18 }}>
                  <div style={{ fontFamily:DISP, fontWeight:600, fontSize:15, color:C.ink, marginBottom:8 }}>{s.title}</div>
                  {s.impact_assessment && (
                    <div style={{ fontSize:12.5, color:C.red, lineHeight:1.6, marginBottom:8, padding:"8px 12px", borderRadius:T.radSm, background:`${C.red}06` }}>
                      <span style={{ fontWeight:700 }}>Impact:</span> {s.impact_assessment}
                    </div>
                  )}
                  {s.recommended_response && (
                    <div style={{ fontSize:12.5, color:C.green, lineHeight:1.6, padding:"8px 12px", borderRadius:T.radSm, background:`${C.green}06` }}>
                      <span style={{ fontWeight:700 }}>Response:</span> {s.recommended_response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ DECISION LAB */
function DecisionView({ isActive, initialMode, initialTab, initialQuery, initialSimContext, onCreateBrief, go }) {
  const [mode, setMode] = useState(initialMode || "landing");
  const [tab, setTab] = useState(initialTab || "lite");
  const [simSessions, setSimSessions] = useState([]);
  const [simResetKey, setSimResetKey] = useState(0);
  const wasActive = useRef(false);

  useEffect(() => {
    if (isActive && !wasActive.current) setSimResetKey(k => k + 1);
    wasActive.current = isActive;
  }, [isActive]);

  const refreshSimSessions = () => fetchSimSessions().then(setSimSessions).catch(() => {});
  useEffect(() => { refreshSimSessions(); }, []);

  useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);
  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);
  useEffect(() => { if (initialQuery || initialSimContext) setTab("lite"); }, [initialQuery, initialSimContext]);

  const DEEP_CARDS = [
    { key:"abm", icon:Target, color:C.green, bg:`${C.green}12`, title:"Automotive Segment Growth", desc:"Business snapshot, account-based marketing strategy, and growth experiment lab for automotive segment.", tag:"DEEP SIM", tagBg:C.greenBg, tagColor:C.green,
      stats:[{label:"YTD vs Plan",value:"-$112M",color:C.red},{label:"Accounts reversed",value:"5",color:C.amber},{label:"Recoverable",value:"+$105M",color:C.goldDk}],
      flow:"Automotive Business Snapshot → Account Intelligence → ABM Workbench → Initiatives" },
    { key:"enterprise", icon:Briefcase, color:C.brand, bg:`${C.brand}12`, title:"Enterprise Deal Analyzer", desc:"Enterprise deal intelligence — DA packets, live pipeline, pricing bridge, and guardrail-based scenario simulation.", tag:"DEEP SIM", tagBg:`${C.brand}18`, tagColor:C.brand,
      stats:[{label:"Active packets",value:"187",color:C.ink},{label:"Bid value",value:"$3.1B",color:C.ink},{label:"CCO action",value:"1",color:C.red}],
      flow:"Enterprise Snapshot → DA Snapshot → Deal Workbench → Initiatives" },
    { key:"wargame", icon:Swords, color:C.red, bg:`${C.red}12`, title:"Competitive Wargame", desc:"Monte Carlo battle simulation — model market share shifts against FedEx, Amazon, DHL, USPS under different competitive scenarios.", tag:"DEEP SIM", tagBg:`${C.red}10`, tagColor:C.red,
      stats:[{label:"Competitors",value:"4",color:C.ink},{label:"Top Threat",value:"FedEx",color:C.red},{label:"Simulations",value:"1K",color:C.ink}],
      flow:"Select Competitor → Intelligence → Battle Simulation → Scenarios" },
    { key:"naaf", icon:Truck, color:C.brand, bg:`${C.brand}12`, title:"NAAF Mexico Launch Simulator", desc:"Pre-lock corridor strategy — model route commitments, FedEx counter-pricing response, and account win probability before August launch.", tag:"DEEP SIM", tagBg:`${C.brand}18`, tagColor:C.brand,
      stats:[{label:"At-Risk Accounts",value:"2 critical",color:C.amber},{label:"Modeled Lift",value:"+$40M",color:C.green},{label:"Decision Window",value:"5 days",color:C.amber}],
      flow:"ABM workbench pre-loaded with Ford + Stellantis NAAF corridor config" },
    { key:"recovery", icon:TrendingUp, color:C.green, bg:`${C.green}12`, title:"FY26 Revenue Recovery Planner", desc:"Gap-to-guide simulation — adjust segment mix, ABM investment, and pricing levers to model the path from Q1 pace to the $89.7B FY target.", tag:"DEEP SIM", tagBg:C.greenBg, tagColor:C.green,
      stats:[{label:"Gap to FY Guide",value:"−$4.9B",color:C.amber},{label:"Recovery Levers",value:"9 active",color:C.brand},{label:"H2 Required Pace",value:"$23.6B/Q",color:C.ink}],
      flow:"Full FY26 bridge model — toggle segment mix, ABM recovery, pricing levers" },
    { key:"pricing", icon:Scale, color:C.amber, bg:`${C.amber}12`, title:"Pricing Portfolio Optimizer", desc:"Guardrail simulation across all 187 in-flight packets — tune L0 DIM floor, L1 accessorial cap, and L2 tier ceiling. See margin realization and win-rate trade-offs in real time.", tag:"DEEP SIM", tagBg:C.amberBg, tagColor:C.amber,
      stats:[{label:"Active Packets",value:"187",color:C.ink},{label:"Realization Gap",value:"84% vs 90%",color:C.amber},{label:"Recoverable",value:"+$36M",color:C.green}],
      flow:"Deal Workbench at portfolio level — same 7 levers applied across the full book" },
  ];

  if (mode === "abm") return (
    <div><ShellTop /><CenterTitle /><ABMDeepView onBack={() => setMode("landing")} onCreateBrief={onCreateBrief} /></div>
  );
  if (mode === "enterprise") return (
    <div><ShellTop /><CenterTitle /><EnterpriseDeepView onBack={() => setMode("landing")} onCreateBrief={onCreateBrief} /></div>
  );
  if (mode === "wargame") return (
    <div><ShellTop /><CenterTitle /><WargameDeepView onBack={() => setMode("landing")} onCreateBrief={onCreateBrief} /></div>
  );

  return (
    <div>
      <ShellTop />
      <CenterTitle />

      {/* Hero */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <span style={{ width:24, height:1, background:T.goldFoil }} />
          <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Decision Lab · Simulation Studio</span>
        </div>
        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:42, color:C.ink, letterSpacing:"-.02em", lineHeight:1.05, marginBottom:14 }}>
          <span style={{ fontStyle:"italic", fontWeight:500, color:C.goldDk }}>Soundboard your ideas, </span> before execution.
        </div>
        {/* <div style={{ fontSize:14.5, color:C.muted, maxWidth:680, lineHeight:1.6 }}>
          Two ways to work an idea. <strong style={{color:C.ink, fontWeight:600}}>Lite</strong> is conversational — fast option thinking against live signals. <strong style={{color:C.ink, fontWeight:600}}>Deep</strong> opens strategic objectives where you commit and push to execution.
        </div> */}
        {/* <div style={{ fontSize:14.5, color:C.muted, maxWidth:680, lineHeight:1.6 }}>
          Two modes to experiment an idea. 
        </div> */}
      </div>

      {/* Mode toggle */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, paddingBottom:18, borderBottom:`1px solid ${C.line}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:9.5, letterSpacing:".24em", color:C.muted, fontWeight:700, textTransform:"uppercase" }}>Mode</span>
          <div style={{ display:"flex", gap:0, background:C.paper, borderRadius:T.radMd, padding:4, border:`1px solid ${C.line}` }}>
            {[["lite","◆ Lite"],["deep","◆◆ Deep"]].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)}
                style={{ padding:"9px 18px", borderRadius:T.radSm, fontSize:11.5, fontWeight:600, cursor:"pointer", fontFamily:FONT, letterSpacing:".02em",
                  background:tab===k?C.card:"transparent", color:tab===k?C.ink:C.muted,
                  border:"none", boxShadow:tab===k?T.shadow1:"none", transition:`all .2s ${T.ease}` }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "lite" ? (
        <FastSimulationView key={simResetKey} initialQuery={initialQuery} initialContext={initialSimContext} onCreateBrief={onCreateBrief} go={go} simSessions={simSessions} refreshSimSessions={refreshSimSessions} />
      ) : (
        <DeepCardsCarousel cards={DEEP_CARDS} onOpen={setMode} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ DEEP CARDS CAROUSEL */
function DeepCardsCarousel({ cards, onOpen }) {
  const [offset, setOffset] = useState(0);
  const visible = Math.min(3, cards.length);
  const gap = 20;
  const maxOffset = Math.max(0, cards.length - visible);
  const canPrev = offset > 0;
  const canNext = offset < maxOffset;
  const containerRef = React.useRef(null);
  const [cardW, setCardW] = useState(0);
  React.useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const cw = containerRef.current.offsetWidth;
        setCardW((cw - gap * (visible - 1)) / visible);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [visible]);

  const arrowBtn = (dir, enabled, onClick) => (
    <button onClick={onClick} disabled={!enabled}
      style={{ width:36, height:36, borderRadius:999, border:`1px solid ${enabled ? C.line2 : C.line}`,
        background:enabled ? C.card : "transparent", cursor:enabled ? "pointer" : "default",
        display:"grid", placeItems:"center", color:enabled ? C.ink : C.faint,
        opacity:enabled ? 1 : .4, transition:`all .2s ${T.ease}`, flexShrink:0 }}
      onMouseEnter={e => { if(enabled) e.currentTarget.style.borderColor = C.gold; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = enabled ? C.line2 : C.line; }}>
      {dir === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <span style={{ fontSize:10, color:C.faint, letterSpacing:".14em", fontWeight:600 }}>{cards.length} OBJECTIVES</span>
        <div style={{ display:"flex", gap:8 }}>
          {arrowBtn("left", canPrev, () => setOffset(o => Math.max(0, o - 1)))}
          {arrowBtn("right", canNext, () => setOffset(o => Math.min(maxOffset, o + 1)))}
        </div>
      </div>
      <div ref={containerRef} style={{ overflow:"hidden" }}>
        <div style={{ display:"flex", gap:gap, transition:`transform .4s ${T.ease}`,
          transform:`translateX(-${offset * (cardW + gap)}px)` }}>
          {cards.map((c) => {
            const Icon = c.icon;
            const enabled = ["abm","enterprise","wargame"].includes(c.key);
            return (
              <div key={c.key} onClick={() => enabled && onOpen(c.key)}
                style={{ flex:`0 0 ${cardW}px`, minWidth:0, textAlign:"left",
                  display:"flex", flexDirection:"column",
                  background:T.cardElevated, border:`1px solid ${C.line}`, borderRadius:T.radLg,
                  padding:"20px 22px", cursor:enabled ? "pointer" : "default", fontFamily:FONT,
                  transition:`transform .25s ${T.ease}, box-shadow .25s ${T.ease}`,
                  boxShadow:T.shadow2, position:"relative", overflow:"hidden",
                  opacity: enabled ? 1 : 0.45, filter: enabled ? "none" : "grayscale(0.6)" }}
                onMouseEnter={e => { if (enabled) { e.currentTarget.style.boxShadow = T.shadow3; e.currentTarget.style.transform = "translateY(-3px)"; }}}
                onMouseLeave={e => { if (enabled) { e.currentTarget.style.boxShadow = T.shadow2; e.currentTarget.style.transform = "translateY(0)"; }}}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:c.color, opacity:.7 }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ width:38, height:38, borderRadius:T.radMd, background:c.bg, display:"grid", placeItems:"center", border:`1px solid ${c.color}22` }}>
                    <Icon size={18} color={c.color} />
                  </div>
                  <span style={{ fontSize:8.5, padding:"3px 9px", borderRadius:T.radPill, fontWeight:700, letterSpacing:".14em", background:c.tagBg, color:c.tagColor }}>{c.tag}</span>
                </div>
                <div style={{ fontFamily:DISP, fontWeight:600, fontSize:17, color:C.ink, marginBottom:6, letterSpacing:"-.01em", lineHeight:1.25 }}>{c.title}</div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.55, marginBottom:14, flex:1 }}>{c.desc}</div>
                {c.stats && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
                    {c.stats.map((s,si) => (
                      <div key={si}>
                        <div style={{ fontSize:8, fontWeight:700, letterSpacing:".12em", color:C.faint, textTransform:"uppercase", marginBottom:2 }}>{s.label}</div>
                        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:16, color:s.color, letterSpacing:"-.02em" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", paddingTop:12, borderTop:`1px solid ${C.line}`, marginTop:"auto" }}>
                  {enabled ? (
                    <span style={{ fontSize:10.5, color:C.goldDk, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase" }}>Open →</span>
                  ) : (
                    <span style={{ fontSize:10.5, color:C.faint, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase" }}>Coming Soon</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Dots */}
      <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:18 }}>
        {Array.from({ length: maxOffset + 1 }, (_, i) => (
          <button key={i} onClick={() => setOffset(i)}
            style={{ width: i === offset ? 18 : 6, height:6, borderRadius:999, border:"none", cursor:"pointer",
              background: i === offset ? C.goldDk : C.line2, transition:`all .3s ${T.ease}` }} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ FOOTNOTE */
function DataFootnote() {
  // return (
  //   <div style={{ fontSize: 11, color: C.faint, marginTop: 22, lineHeight: 1.5, maxWidth: 900 }}>
  //     Public anchors from UPS 1Q 2026 results (revenue per piece $15.32 / +7.7%, US Domestic ADV −8% YoY, SMB
  //     penetration 34.5% record, first $3B healthcare quarter, International +3.8%). Cohort, sentiment, CAC and
  //     simulation figures (and metrics marked *) are illustrative TwinX scenario data for demonstration.
  //   </div>
  // );
}

/* ------------------------------------------------------------------ APP */
function ThemeSwitcher({ themeName, onChange }) {
  const [open, setOpen] = useState(false);
  const active = THEMES[themeName];
  const closeRef = React.useRef();
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (closeRef.current && !closeRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={closeRef} style={{ position:"fixed", top:22, right:26, zIndex:1500, fontFamily:FONT }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px 8px 12px", background:C.card,
          border:`1px solid ${C.line2}`, borderRadius:T.radPill, cursor:"pointer", boxShadow:T.shadow2,
          color:C.ink, fontSize:11, fontWeight:600, fontFamily:FONT, letterSpacing:".02em", transition:`all .2s ${T.ease}` }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadow3}
        onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow2}>
        <div style={{ display:"flex", gap:3 }}>
          {active.swatch.map((s, i) => (
            <div key={i} style={{ width:11, height:11, borderRadius:"50%", background:s, border:`1px solid ${C.line2}` }} />
          ))}
        </div>
        <span style={{ fontSize:10.5, letterSpacing:".08em" }}>{active.name}</span>
        <span style={{ display:"inline-grid", placeItems:"center", width:18, height:18, borderRadius:999, background:C.line, color:C.muted, fontSize:8 }}>{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div style={{ position:"absolute", top:52, right:0, width:340, background:T.cardElevated,
          border:`1px solid ${C.line2}`, borderRadius:T.radLg, padding:16, boxShadow:T.shadow3,
          animation:"fadeIn .2s ease-out" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <span style={{ width:16, height:1, background:T.goldFoil }} />
            <div style={{ fontSize:9, letterSpacing:".24em", color:C.goldDk, fontWeight:700, textTransform:"uppercase" }}>Theme</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {Object.entries(THEMES).map(([key, t]) => {
              const isActive = key === themeName;
              return (
                <button key={key} onClick={() => { onChange(key); setOpen(false); }}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 13px",
                    background:isActive ? `${C.gold}10` : C.card,
                    border:`1.5px solid ${isActive ? C.gold : C.line}`, borderRadius:T.radMd, cursor:"pointer",
                    textAlign:"left", fontFamily:FONT, transition:`all .2s ${T.ease}`, position:"relative", overflow:"hidden" }}
                  onMouseEnter={e => { if(!isActive) e.currentTarget.style.borderColor = C.line2; }}
                  onMouseLeave={e => { if(!isActive) e.currentTarget.style.borderColor = C.line; }}>
                  {isActive && <span style={{ position:"absolute", top:0, left:0, bottom:0, width:2, background:T.goldFoil }} />}
                  <div style={{ display:"flex", gap:0, flexShrink:0, borderRadius:5, overflow:"hidden", boxShadow:T.shadow1 }}>
                    {t.swatch.map((s, i) => (
                      <div key={i} style={{ width:18, height:36, background:s }} />
                    ))}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:DISP, fontSize:13, fontWeight:600, color:C.ink, marginBottom:3, letterSpacing:"-.005em" }}>{t.name}</div>
                    <div style={{ fontSize:10.5, color:C.muted, lineHeight:1.4 }}>{t.desc}</div>
                  </div>
                  {isActive && <Check size={14} color={C.gold} style={{ flexShrink:0 }} />}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${C.line}`, fontSize:9, color:C.faint, letterSpacing:".18em", textTransform:"uppercase", fontWeight:600 }}>
            Preference persists across sessions
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ LOGIN SCREEN */
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = mode === "login"
        ? await loginUser(username, password)
        : await registerUser(username, password, fullName, secretKey);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Light, single-panel premium login — one font (FONT), one accent (gold).
  // Tasteful premium details: gold hairline accents, soft card lift, refined micro-spacing.
  const _ink = "#1A1814";
  const _ink2 = "#4A463E";
  const _muted = "#8B857A";
  const _faint = "#B8B2A6";
  const _paper = "#FAF8F3";
  const _card = "#FFFFFF";
  const _line = "#EDE7DA";
  const _lineSoft = "#F1ECDE";
  const _g = C.gold;
  const _gdk = C.goldDk;

  return (
    <div style={{
      position: "fixed", inset: 0, fontFamily: FONT,
      background: _paper,
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        @keyframes lfadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lspin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes lfloat1 { 0%,100% { transform: translate(0,0) scale(1); opacity:.55; } 50% { transform: translate(20px,-30px) scale(1.05); opacity:.75; } }
        @keyframes lfloat2 { 0%,100% { transform: translate(0,0) scale(1); opacity:.4; } 50% { transform: translate(-25px,20px) scale(1.08); opacity:.6; } }
        @keyframes lhair { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .login-input:focus { outline: none; }
        .login-input::placeholder { color: ${_faint}; font-weight: 400; }
      `}</style>

      {/* Ambient gold orbs — soft motion behind card */}
      <div style={{
        position: "absolute", top: "18%", left: "28%", width: 480, height: 480,
        borderRadius: "50%", pointerEvents: "none",
        background: `radial-gradient(circle, ${_g}14 0%, transparent 65%)`,
        animation: "lfloat1 14s ease-in-out infinite",
        filter: "blur(8px)",
      }} />
      <div style={{
        position: "absolute", bottom: "12%", right: "22%", width: 420, height: 420,
        borderRadius: "50%", pointerEvents: "none",
        background: `radial-gradient(circle, ${_g}0E 0%, transparent 65%)`,
        animation: "lfloat2 18s ease-in-out infinite",
        filter: "blur(10px)",
      }} />
      {/* Fine grain via 2nd radial */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(circle at 50% 0%, rgba(255,255,255,.6) 0%, transparent 35%)`,
      }} />

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 2,
        width: 440, background: `linear-gradient(180deg, #FFFFFF 0%, #FDFBF6 100%)`,
        borderRadius: 18, border: `1px solid ${_line}`,
        boxShadow: `
          0 1px 0 rgba(255,255,255,.9) inset,
          0 0 0 1px rgba(${parseInt(_g.slice(1,3),16)},${parseInt(_g.slice(3,5),16)},${parseInt(_g.slice(5,7),16)},.04),
          0 30px 70px rgba(60,50,30,.10),
          0 8px 24px rgba(60,50,30,.06)
        `,
        padding: "40px 44px 32px",
        animation: "lfadeIn .55s cubic-bezier(.2,.7,.3,1)",
        overflow: "hidden",
      }}>
        {/* Top gold hairline accent */}
        <div style={{
          position: "absolute", top: 0, left: "25%", right: "25%", height: 1,
          background: `linear-gradient(90deg, transparent, ${_g}80, transparent)`,
          transformOrigin: "center", animation: "lhair 1s ease-out .2s both",
        }} />

        {/* Brand mark — refined two-line layout */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 30 }}>
          <div style={{
            width: 38, height: 28, borderRadius: 6, background: T.goldFoil,
            display: "grid", placeItems: "center", position: "relative",
            boxShadow: `0 3px 12px ${_g}38, inset 0 1px 0 rgba(255,255,255,.45)`,
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 800, color: "#fff", fontSize: 10.5, letterSpacing: ".06em" }}>UPS</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: _ink, letterSpacing: ".01em" }}>CCO·OS</span>
            <span style={{ fontSize: 10, color: _muted, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", marginTop: 2 }}>
              CXO Companion
            </span>
          </div>
          {/* Tiny live-status dot */}
          <span style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            fontSize: 10, color: _muted, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999,
              background: "#10B981", boxShadow: "0 0 0 3px rgba(16,185,129,.18)",
            }} />
            Live
          </span>
        </div>

        {/* Kicker + heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ width: 18, height: 1, background: _g }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", color: _gdk, textTransform: "uppercase" }}>
            {mode === "login" ? "Sign in" : "Get started"}
          </span>
        </div>
        <h2 style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 26, color: _ink,
          lineHeight: 1.2, letterSpacing: "-.018em", margin: "0 0 6px",
        }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <div style={{ fontSize: 13.5, color: _muted, fontWeight: 400, lineHeight: 1.55, marginBottom: 26 }}>
          {mode === "login"
            ? "Continue to your commercial workspace."
            : "Provision your access in seconds."}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div style={{ marginBottom: 12 }}>
              <input className="login-input" value={fullName} onChange={e => setFullName(e.target.value)}
                onFocus={() => setFocusField("name")} onBlur={() => setFocusField(null)}
                placeholder="Full name"
                style={{
                  width: "100%", padding: "13px 16px", borderRadius: 10, boxSizing: "border-box",
                  background: focusField === "name" ? "#FFFFFF" : _paper,
                  border: `1px solid ${focusField === "name" ? _g : _lineSoft}`,
                  color: _ink, fontFamily: FONT, fontSize: 14, fontWeight: 500,
                  transition: `all .18s ${T.ease}`,
                  boxShadow: focusField === "name" ? `0 0 0 4px ${_g}14, 0 1px 2px rgba(0,0,0,.02)` : "0 1px 2px rgba(0,0,0,.02) inset",
                }} />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <input className="login-input" value={username} onChange={e => setUsername(e.target.value)} required
              onFocus={() => setFocusField("user")} onBlur={() => setFocusField(null)}
              autoComplete="username" placeholder="Username"
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 10, boxSizing: "border-box",
                background: focusField === "user" ? "#FFFFFF" : _paper,
                border: `1px solid ${focusField === "user" ? _g : _lineSoft}`,
                color: _ink, fontFamily: FONT, fontSize: 14, fontWeight: 500,
                transition: `all .18s ${T.ease}`,
                boxShadow: focusField === "user" ? `0 0 0 4px ${_g}14, 0 1px 2px rgba(0,0,0,.02)` : "0 1px 2px rgba(0,0,0,.02) inset",
              }} />
          </div>

          <div style={{ marginBottom: mode === "register" ? 12 : 20 }}>
            <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required
              onFocus={() => setFocusField("pass")} onBlur={() => setFocusField(null)}
              autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Password"
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 10, boxSizing: "border-box",
                background: focusField === "pass" ? "#FFFFFF" : _paper,
                border: `1px solid ${focusField === "pass" ? _g : _lineSoft}`,
                color: _ink, fontFamily: FONT, fontSize: 14, fontWeight: 500,
                transition: `all .18s ${T.ease}`,
                boxShadow: focusField === "pass" ? `0 0 0 4px ${_g}14, 0 1px 2px rgba(0,0,0,.02)` : "0 1px 2px rgba(0,0,0,.02) inset",
              }} />
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 20 }}>
              <input className="login-input" type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} required
                onFocus={() => setFocusField("secret")} onBlur={() => setFocusField(null)}
                placeholder="Registration secret key"
                style={{
                  width: "100%", padding: "13px 16px", borderRadius: 10, boxSizing: "border-box",
                  background: focusField === "secret" ? "#FFFFFF" : _paper,
                  border: `1px solid ${focusField === "secret" ? _g : _lineSoft}`,
                  color: _ink, fontFamily: FONT, fontSize: 14, fontWeight: 500,
                  transition: `all .18s ${T.ease}`,
                  boxShadow: focusField === "secret" ? `0 0 0 4px ${_g}14, 0 1px 2px rgba(0,0,0,.02)` : "0 1px 2px rgba(0,0,0,.02) inset",
                }} />
            </div>
          )}

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9,
              padding: "10px 13px", marginBottom: 14, fontSize: 12.5, color: "#B91C1C",
              display: "flex", alignItems: "center", gap: 8, fontWeight: 500,
            }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 0 0 1px ${_gdk}, 0 10px 24px ${_g}45, inset 0 1px 0 rgba(255,255,255,.25)`; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 14px ${_g}30, inset 0 1px 0 rgba(255,255,255,.2)`; }}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
              background: `linear-gradient(180deg, ${_g} 0%, ${_gdk} 100%)`,
              color: "#fff", fontFamily: FONT, fontWeight: 600, fontSize: 14,
              cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              letterSpacing: ".015em", transition: `all .22s ${T.ease}`,
              boxShadow: `0 4px 14px ${_g}30, inset 0 1px 0 rgba(255,255,255,.2)`,
              position: "relative", overflow: "hidden",
            }}>
            {loading
              ? <Loader2 size={15} style={{ animation: "lspin 1s linear infinite" }} />
              : <LogIn size={14} />
            }
            <span>{loading ? "Signing in…" : mode === "login" ? "Sign in" : "Create account"}</span>
          </button>

          {mode === "login" && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 9,
              background: `linear-gradient(180deg, ${_g}0A 0%, ${_g}06 100%)`,
              border: `1px solid ${_g}24`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              {/* <Lightbulb size={12} color={_gdk} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: _ink2, fontWeight: 500, letterSpacing: ".01em" }}>
                Demo · <span style={{ color: _ink, fontWeight: 700 }}>admin</span> / <span style={{ color: _ink, fontWeight: 700 }}>admin123</span>
              </span> */}
            </div>
          )}
        </form>

        {/* Toggle row — disabled */}
      </div>

      {/* Bottom micro-footer with security badge */}
      <div style={{
        position: "absolute", bottom: 22, left: 0, right: 0,
        display: "flex", justifyContent: "center", alignItems: "center", gap: 14,
        fontSize: 10, letterSpacing: ".18em", color: _faint, fontWeight: 600, textTransform: "uppercase",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Shield size={10} /> Encrypted access
        </span>
        <span style={{ width: 3, height: 3, borderRadius: 999, background: _faint, opacity: 0.5 }} />
        <span>Powered by TwinX™</span>
      </div>
    </div>
  );
}

export default function App() {
  const [authedUser, setAuthedUser] = useState(getStoredUser);

  useEffect(() => {
    const onLogout = () => setAuthedUser(null);
    window.addEventListener("cco-logout", onLogout);
    return () => window.removeEventListener("cco-logout", onLogout);
  }, []);

  if (!authedUser || !isAuthenticated()) {
    return <LoginScreen onLogin={(user) => setAuthedUser(user)} />;
  }

  return <AppShell user={authedUser} onLogout={() => { logoutUser(); setAuthedUser(null); }} />;
}

function AppShell({ user, onLogout }) {
  const [view, setView] = useState("home");
  const [deepInitialMode, setDeepInitialMode] = useState(null);
  const [deepInitialTab, setDeepInitialTab] = useState(null);
  const [initialLabQuery, setInitialLabQuery] = useState("");
  const [initialSimContext, setInitialSimContext] = useState(null);
  const [investigateSource, setInvestigateSource] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [selectedAttention, setSelectedAttention] = useState(null);
  const [selectedMemoryItem, setSelectedMemoryItem] = useState(null);
  const [briefContext, setBriefContext] = useState(null);
  const [briefEditorData, setBriefEditorData] = useState(null);
  const [briefPrevView, setBriefPrevView] = useState("home");
  const [activeSection, setActiveSection] = useState(null); // tracks visible section on signal detail page
  const [toasts, setToasts] = useState([]);
  const [themeName, setThemeName] = useState(_initialTheme);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  // Companion LLM provider ("gemini" | "slm"). Default from env, switchable in the dock header.
  const [llmProvider, setLlmProvider] = useState(() => localStorage.getItem("cco-llm-provider") || DEFAULT_LLM_PROVIDER);
  const changeLlmProvider = (p) => { setLlmProvider(p); try { localStorage.setItem("cco-llm-provider", p); } catch {} };

  useEffect(() => {
    fetchChatSessions().then(setChatSessions).catch(() => {});
  }, []);

  // Section change → reset chat to fresh state (close + clear) so new chat is contextual to new section
  useEffect(() => {
    if (activeSection) {
      setChatOpen(false);
      setChatMinimized(false);
      setChatMessages([]);
      setChatSessionId(null);
    }
  }, [activeSection]);

  const refreshSessions = () => fetchChatSessions().then(setChatSessions).catch(() => {});

  // Build section-specific context for current section the user is viewing
  const buildSectionContext = () => {
    if (view !== "signalDetail" || !selectedSignal) return null;
    const enr = selectedSignal.signal_enrichment || {};
    const s = selectedSignal;
    const sectionMap = {
      "why-it-matters": `Section: "Why it matters" for signal "${s.title}".\nContent: ${enr.why_it_matters || s.why || ""}\nKey metrics: ${(enr.metrics || []).map(m => `${m.label}: ${m.value}`).join("; ")}`,
      "key-insight": `Section: "Key Insight" for signal "${s.title}".\nContent: ${enr.key_insight || ""}`,
      "recent-activity": `Section: "Recent Activity" for signal "${s.title}".\nActivity log:\n${(enr.recent_activity || []).map(a => `- ${a.time}: ${a.action}`).join("\n")}`,
      "related-topics": `Section: "Related Topics" for signal "${s.title}".\nTopics: ${(enr.related_topics || []).join(", ")}`,
      "recommended-takeaways": `Section: "Recommended Takeaways" for signal "${s.title}".\nTakeaways:\n${(enr.recommended_takeaways || []).map((t, i) => `${i+1}. ${t.action} — ${t.reasoning} → Impact: ${t.impact}`).join("\n")}`,
      "signal-strength": `Section: "Signal Strength" for signal "${s.title}".\nConfidence: ${enr.confidence_description || ""}\nData sources: ${(enr.data_sources || []).map(d => `${d.name} (${d.confidence})`).join(", ")}`,
    };
    return sectionMap[activeSection] || `Signal: ${s.title}\nWhy: ${s.why || enr.why_it_matters || ""}`;
  };

  const buildSignalContext = () => {
    if (view !== "signalDetail" || !selectedSignal) return null;
    const s = selectedSignal;
    return `Signal: ${s.title}\nType: ${s.type || s.tag}\nSource: ${s.source || s.src}\nImpact: ${s.impact || s.tone}\nAffected accounts: ${(s.accounts || []).join(", ")}`;
  };

  const pendingSignalCtxRef = useRef(null);

  const handleChatSend = async (msg, docContext, { signalCtx } = {}) => {
    if (!msg || !msg.trim()) return;
    setChatOpen(true); setChatMinimized(false);
    setChatMessages(prev => [...prev, { role:"user", text:msg.trim() }, { role:"agent", text:"", options:null, quickReplies:null, sources:null, isStreaming:true, isSkeletonOptions:false, isSkeletonReplies:false }]);
    setChatLoading(true);

    const history = chatMessages.map(m => ({ role: m.role === "user" ? "user" : "model", text: m.text }));
    let buffered = "";
    let receivedSession = chatSessionId;
    const sigCtx = signalCtx || pendingSignalCtxRef.current || buildSignalContext();
    pendingSignalCtxRef.current = sigCtx;

    await chatWithAgentStream(msg, {
      history,
      session_id: chatSessionId,
      signal_context: sigCtx,
      section_context: buildSectionContext(),
      view_context: view,
      document_context: docContext || null,
      provider: llmProvider,
      onSession: (sid) => { receivedSession = sid; setChatSessionId(sid); },
      onChunk: (chunk) => {
        buffered += chunk;
        let cleanText = buffered;
        let options = null;
        let quickReplies = null;
        const hasOptionsOpen = (buffered.includes("<options>") && !buffered.includes("</options>")) || (buffered.includes("<option ") && !buffered.includes("</option>"));
        const hasRepliesOpen = buffered.includes("<quick_replies>") && !buffered.includes("</quick_replies>");
        if (!hasOptionsOpen) { options = _parseOpts(cleanText); if (options) { cleanText = _stripTag(cleanText, "options"); cleanText = _stripTag(cleanText, "option"); } }
        else { cleanText = cleanText.split(/<option[s\s]/)[0]; }
        if (!hasRepliesOpen) { quickReplies = _parseQR(cleanText); if (quickReplies) cleanText = _stripTag(cleanText, "quick_replies"); }
        else { cleanText = cleanText.split("<quick_replies>")[0]; }
        const hasSourcesOpen = buffered.includes("<sources>") && !buffered.includes("</sources>");
        let sources = !hasSourcesOpen ? _parseSources(cleanText) : null;
        if (sources) cleanText = _stripTag(cleanText, "sources");
        else if (hasSourcesOpen) cleanText = cleanText.split("<sources>")[0];
        cleanText = cleanText.replace(/<\/?(?:options?|sim_result|sources|quick_replies?|text|description|id)(?:\s[^>]*)?\/?>/g, "").trim();
        setChatMessages(prev => {
          const next = [...prev];
          if (next.length && next[next.length - 1].role === "agent") {
            next[next.length - 1] = { ...next[next.length - 1], text: cleanText, options, quickReplies, sources, isSkeletonOptions: hasOptionsOpen, isSkeletonReplies: hasRepliesOpen };
          }
          return next;
        });
      },
      onDone: () => {
        setChatMessages(prev => {
          const next = [...prev];
          if (next.length && next[next.length - 1].role === "agent") next[next.length - 1] = { ...next[next.length - 1], isStreaming: false };
          return next;
        });
        setChatLoading(false);
        refreshSessions();
      },
      onError: () => {
        setChatMessages(prev => {
          const next = [...prev];
          if (next.length && next[next.length - 1].role === "agent" && !next[next.length - 1].text) {
            next[next.length - 1] = { role: "agent", text: "Error: Could not reach agent. Please try again.", isStreaming: false };
          }
          return next;
        });
        setChatLoading(false);
      },
    });
  };

  const handleSignalChat = (signal) => {
    setChatMessages([]);
    setChatSessionId(null);
    const sigCtx = `Signal: ${signal.title}\nType: ${signal.signal_type || "Market Signal"}\nTone: ${signal.tone || "neutral"}\nSource: ${signal.source || ""}\nDelta: ${signal.delta_value || ""}\nAction: ${signal.recommended_action_summary || ""}\nStrategy: ${signal.strategy_tag || ""}`;
    const q = `What should I know about: ${signal.title}?`;
    handleChatSend(q, null, { signalCtx: sigCtx });
  };

  const handleNewChat = () => {
    setChatMessages([]);
    setChatSessionId(null);
  };

  const handleLoadSession = async (id) => {
    try {
      const data = await fetchChatMessages(id);
      setChatMessages(data.messages.map(m => {
        let text = m.text || "";
        let options = null;
        let quickReplies = null;
        options = _parseOpts(text); if (options) { text = _stripTag(text, "options"); text = _stripTag(text, "option"); }
        quickReplies = _parseQR(text); if (quickReplies) text = _stripTag(text, "quick_replies");
        let sources = _parseSources(text); if (sources) text = _stripTag(text, "sources");
        return { role: m.role, text: text.trim(), options, quickReplies, sources };
      }));
      setChatSessionId(id);
    } catch { }
  };

  const handleDeleteSession = async (id) => {
    try {
      await deleteChatSession(id);
      if (chatSessionId === id) { setChatMessages([]); setChatSessionId(null); }
      refreshSessions();
    } catch { }
  };
  /* Universal navigator — second arg is optional context object.
     Frontend components call go("investigate", attentionItem) to deep-link with payload.
     CTA actions like "deal-workbench" map to existing top-level views. */
  const CTA_ROUTE_MAP = {
    "investigate":"investigate", "signals":"signals", "decision":"decision",
    "memory":"memory", "memory-detail":"memory-detail", "deal-workbench":"decision", "abm-account":"decision",
    "deep-abm":"decision",
    "deep-enterprise":"decision",
    "decision-deep":"decision",
    "decision-with-query":"decision",
    "decision-with-sim-context":"decision",
    "alignment-brief":"alignment-brief",
    "alignment-brief-editor":"alignment-brief-editor",
    "home":"home",
  };
  const go = (v, ctx) => {
    if (ctx && ctx.investigation_payload !== undefined) setSelectedAttention(ctx);
    else if (v === "home") setSelectedAttention(null);
    if (v === "memory-detail" && ctx) setSelectedMemoryItem(ctx);
    if (v === "alignment-brief" && ctx) { setBriefContext(ctx); setBriefPrevView(view); }
    if (v === "alignment-brief-editor" && ctx) setBriefEditorData(ctx);
    if (v === "deep-abm") { setDeepInitialMode("abm"); setDeepInitialTab(null); }
    else if (v === "deep-enterprise") { setDeepInitialMode("enterprise"); setDeepInitialTab(null); }
    else if (v === "decision-deep") { setDeepInitialMode(null); setDeepInitialTab("deep"); }
    else { setDeepInitialMode(null); setDeepInitialTab(null); }
    if (v === "decision-with-sim-context" && ctx) {
      setInitialLabQuery(ctx.query || "");
      setInitialSimContext(ctx);
    } else if (v === "decision-with-query" && ctx) {
      const q = typeof ctx === "string" ? ctx : (ctx.title ? `What is the impact of "${ctx.title}" and what should we do about it?` : "");
      setInitialLabQuery(q);
      setInitialSimContext(null);
    } else if (v !== "decision") {
      setInitialLabQuery("");
      setInitialSimContext(null);
    }
    if (v === "investigate" && ctx?._openInvitePanel) setInvestigateSource("signals");
    else if (v !== "investigate") setInvestigateSource(null);
    const target = CTA_ROUTE_MAP[v] || v;
    // Auto-close chat + reset session on view navigation — fresh context per screen
    if (target !== view) {
      setChatOpen(false);
      setChatMinimized(false);
      setChatMessages([]);
      setChatSessionId(null);
      setActiveSection(null);
    }
    setView(target);
  };

  /* Apply theme synchronously before render so first paint uses new C values */
  applyTheme(themeName);

  useEffect(() => {
    try { localStorage.setItem("cxo-theme", themeName); } catch {}
  }, [themeName]);
  const toastIdRef = React.useRef(0);
  const pushToast = React.useCallback((t) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, ...t }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), t.duration || 4500);
  }, []);
  const dismissToast = (id) => setToasts(prev => prev.filter(x => x.id !== id));

  const Views = {
    home: <HomeView go={go} onOpenChat={handleChatSend} chatOpen={chatOpen} onSignalChat={handleSignalChat} />,
    investigate: <InvestigateView go={go} attention={selectedAttention} onSessionUpdate={refreshSessions} />,
    simulator: <SimulatorView go={go} />,
    signals: <SignalsView go={go} onSelectSignal={setSelectedSignal} />,
    signalDetail: <SignalDetailView go={go} signal={selectedSignal} onSectionChange={setActiveSection} />,
    memory: <MemoryView go={go} />,
    "memory-detail": <MemoryDetailView go={go} item={selectedMemoryItem} />,
    "alignment-brief": <AlignmentBriefOverview go={go} briefContext={briefContext} prevView={briefPrevView} onEditBrief={(data) => { setBriefEditorData(data); setView("alignment-brief-editor"); }} />,
    "alignment-brief-editor": <AlignmentBriefEditor go={go} briefData={briefEditorData} onBack={() => setView("alignment-brief")} />,
  };
  const isDecisionFamily = view === "decision" || view === "alignment-brief" || view === "alignment-brief-editor";
  const [decisionMounted, setDecisionMounted] = useState(false);
  useEffect(() => { if (isDecisionFamily) setDecisionMounted(true); }, [isDecisionFamily]);
  return (
    <SidebarCtx.Provider value={{ collapsed: sidebarCollapsed }}>
    <ToastCtx.Provider value={{ push: pushToast }}>
    <div key={themeName} style={{ display:"flex", height:"100vh", fontFamily:FONT, background:T.paperGrad, color:C.ink, overflow:"hidden", padding:"14px 0 14px 14px", gap:14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; }
        html, body { font-family: ${FONT}; font-size: 13px; line-height: 1.5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        button, input, select, textarea { font-family: inherit; font-size: inherit; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.line2}; border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.muted}; }
        .brief-textarea { scrollbar-width: none; overflow-y: auto; }
        .brief-textarea::-webkit-scrollbar { display: none; }
        .brief-textarea:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 2px ${C.gold}22 !important; }
        input[type=range]{ height: 4px; border-radius: 4px; }
        ::selection { background: ${C.gold}40; color: ${C.ink}; }
        .markdown-body { font-family: inherit; font-size: inherit; line-height: 1.6; color: ${C.ink}; }
        .markdown-body p { margin-top: 0; margin-bottom: 10px; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body ul, .markdown-body ol { margin-top: 0; margin-bottom: 10px; padding-left: 22px; }
        .markdown-body li { margin-bottom: 5px; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin-top: 0; margin-bottom: 10px; font-weight: 600; font-family: 'Archivo', sans-serif; letter-spacing: -.005em; }
        .markdown-body code { background: ${C.line}; padding: 2px 5px; border-radius: 4px; font-size: 0.88em; color: ${C.ink}; font-family: 'IBM Plex Mono', monospace; }
        .markdown-body pre { background: ${C.line}; padding: 14px; border-radius: 10px; overflow-x: auto; margin-bottom: 10px; color: ${C.ink}; }
        .markdown-body pre code { background: none; padding: 0; }
        .markdown-body strong { color: ${C.ink}; font-weight: 600; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 0.92em; }
        .markdown-body thead th { text-align: left; padding: 8px 10px; border-bottom: 2px solid ${C.line}; font-size: 0.85em; letter-spacing: .08em; text-transform: uppercase; color: ${C.muted}; font-weight: 700; white-space: nowrap; }
        .markdown-body tbody td { padding: 7px 10px; border-bottom: 1px solid ${C.line}08; color: ${C.ink2}; }
        .markdown-body tbody tr:nth-child(even) { background: ${C.gold}05; }
        .markdown-body tbody td:first-child { font-weight: 600; color: ${C.ink}; }
        .markdown-body blockquote { border-left: 3px solid ${C.goldDk}; margin: 0 0 10px 0; padding: 8px 14px; background: ${C.gold}06; border-radius: 0 ${T.radSm} ${T.radSm} 0; color: ${C.ink2}; }
        .markdown-body hr { border: none; border-top: 1px solid ${C.line}; margin: 14px 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
      <Sidebar view={view} go={go} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} themeName={themeName} setThemeName={setThemeName} user={user} onLogout={onLogout} investigateSource={investigateSource} />
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 44px 40px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          {decisionMounted && <div style={{ display: view === "decision" ? "block" : "none" }}>
            <DecisionView isActive={view === "decision"} initialMode={deepInitialMode} initialTab={deepInitialTab} initialQuery={initialLabQuery} initialSimContext={initialSimContext} onCreateBrief={(ctx) => go("alignment-brief", ctx)} go={go} />
          </div>}
          {isDecisionFamily && view !== "decision" ? Views[view] : null}
          {!isDecisionFamily ? Views[view] : null}
        </div>
      </div>
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
    {/* Chat overlay — rendered outside flex layout so it floats on top */}
    <ChatPanel open={chatOpen} minimized={chatMinimized} messages={chatMessages} loading={chatLoading}
      provider={llmProvider} onProviderChange={changeLlmProvider}
      onSend={handleChatSend}
      onSimulate={() => {
        const sigCtx = pendingSignalCtxRef.current || "";
        const titleMatch = sigCtx.match(/Signal:\s*(.+?)(?:\n|$)/);
        const cardTitle = titleMatch ? titleMatch[1] : "";
        const fullHistory = chatMessages.filter(m => !m.isStreaming && m.text).map(m => {
          let content = m.text || "";
          if (m.quickReplies) content = content.replace(/<quick_replies>[\s\S]*?<\/quick_replies>/g, "").trim();
          if (m.options) content = content.replace(/<options>[\s\S]*?<\/options>/g, "").trim();
          return { role: m.role, text: content.slice(0, 500) };
        });
        const lastUserMsg = [...fullHistory].reverse().find(m => m.role === "user")?.text || "";
        const query = cardTitle
          ? `Simulate: ${cardTitle} — model the financial impact and strategic options based on our analysis.`
          : lastUserMsg
            ? `Simulate: ${lastUserMsg.slice(0, 120)}${lastUserMsg.length > 120 ? "..." : ""} — model impact and trade-offs.`
            : "Simulate the strategic scenario we discussed — model impact and options.";
        setChatOpen(false); setChatMinimized(false);
        go("decision-with-sim-context", {
          query,
          cardTitle,
          signalContext: sigCtx,
          chatHistory: fullHistory,
        });
      }}
      onClose={() => { setChatOpen(false); setChatMinimized(false); }}
      onMinimize={() => { if (view === "home") { setChatOpen(false); setChatMinimized(false); } else { setChatMinimized(true); } }}
      onExpand={() => setChatMinimized(false)}
      onNewChat={handleNewChat}
      sessions={chatSessions}
      onLoadSession={handleLoadSession}
      onDeleteSession={handleDeleteSession}
      activeSessionId={chatSessionId}
      contextQuestions={(() => {
        // Section-specific questions take priority — most specific context wins
        if (view === "signalDetail" && activeSection && selectedSignal) {
          const title = selectedSignal.title || "this signal";
          const SECTION_Q = {
            "why-it-matters": [
              `Why does "${title}" matter for UPS strategy?`,
              "What's the financial impact if we don't act on this?",
              "How does this affect our Q3 commercial plan?",
              "Which competitors are positioned to capitalize on this?",
            ],
            "signal-strength": [
              "How confident are we in this signal?",
              "What other data sources should we corroborate this with?",
              "Has this signal type been reliable historically?",
              "Who should validate this before we act?",
            ],
            "key-insight": [
              "Break down the key insight in plain terms",
              "What's the most important takeaway here?",
              "What's the counter-argument to this insight?",
              "What would have to be true for this to be wrong?",
            ],
            "recent-activity": [
              "Summarize the timeline of events",
              "What's the most recent development I should know?",
              "What should I expect to happen next?",
              "Who is driving each of these actions?",
            ],
            "related-topics": [
              "How are these topics connected to the main signal?",
              "Which related topic has the highest impact?",
              "Which accounts are most affected?",
              "What other signals connect to this topic?",
            ],
            "recommended-takeaways": [
              "Which takeaway should I prioritize first?",
              "What's the ROI of each recommended action?",
              "Who owns execution for each takeaway?",
              "What's the risk of not acting on any of these?",
            ],
          };
          if (SECTION_Q[activeSection]) return SECTION_Q[activeSection];
        }
        if (view === "signalDetail" && selectedSignal?.signal_enrichment?.context_questions) return selectedSignal.signal_enrichment.context_questions;
        if (view === "signalDetail" && selectedSignal?.investigation_payload?.follow_ups) {
          return selectedSignal.investigation_payload.follow_ups.filter(f => f.type === "chat").map(f => f.label || f.prompt).concat(["What should I do about this signal?", "Who else should be involved?", "What's the timeline?"]).slice(0, 4);
        }
        if (view === "signalDetail") return ["What does this signal mean for our strategy?", "What should I do about this?", "Who should be involved in this decision?", "How does this compare to last quarter?"];
        if (view === "signals") return ["What are the top market signals today?", "Which signals need immediate action?", "How do these signals affect our Q3 targets?", "Summarize competitive threats this week"];
        if (view === "decision") return ["What scenarios should I model first?", "How sensitive is revenue to pricing changes?", "What levers have the highest impact?", "Compare last 3 simulation results"];
        return null;
      })()} />
    {!chatOpen && view !== "investigate" && view !== "decision" && <ChatFAB onClick={() => { setChatOpen(true); setChatMinimized(false); }} />}
    </ToastCtx.Provider>
    </SidebarCtx.Provider>
  );
}
