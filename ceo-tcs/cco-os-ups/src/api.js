// ============================================================
// api.js — CCO·OS frontend data layer
//
// Works in two modes:
//   • LIVE   — a real backend is reachable at VITE_API_BASE_URL; every
//              call hits the API exactly as before.
//   • DEMO   — no backend reachable (e.g. static GitHub Pages deploy).
//              Data endpoints fall back to bundled fixtures captured from
//              a seeded backend, and LLM/streaming endpoints return canned
//              demo responses so every page is usable offline.
//
// The fallback is automatic and per-call: each request tries the network
// first and only uses the local fixture if the request fails.
// ============================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : "http://localhost:8000";

export const prepareURL = (endpoint) => `${BASE_URL}${endpoint}`;

// Default companion LLM provider ("gemini" | "slm"). UI toggle overrides per-request.
export const DEFAULT_LLM_PROVIDER = (import.meta.env.VITE_LLM_PROVIDER || "gemini").toLowerCase() === "slm" ? "slm" : "gemini";

// ── Bundled fixtures (used when the backend is unreachable) ────────
import fx_home from "./fixtures/home.json";
import fx_attention from "./fixtures/attention.json";
import fx_attention_categories from "./fixtures/attention_categories.json";
import fx_attention_groups from "./fixtures/attention_groups.json";
import fx_kpis from "./fixtures/kpis.json";
import fx_signals from "./fixtures/signals.json";
import fx_signal_details from "./fixtures/signal_details.json";
import fx_levers from "./fixtures/levers.json";
import fx_scenarios from "./fixtures/scenarios.json";
import fx_scenario_details from "./fixtures/scenario_details.json";
import fx_abm_signals from "./fixtures/abm_signals.json";
import fx_abm_signal_details from "./fixtures/abm_signal_details.json";
import fx_abm_insights from "./fixtures/abm_insights.json";
import fx_ent_insights from "./fixtures/ent_insights.json";
import fx_ent_snapshot from "./fixtures/ent_snapshot.json";
import fx_da_overview from "./fixtures/da_overview.json";
import fx_packet_details from "./fixtures/packet_details.json";
import fx_deal_levers from "./fixtures/deal_levers.json";
import fx_ent_initiatives from "./fixtures/ent_initiatives.json";
import fx_deal_workbench_sim from "./fixtures/deal_workbench_sim.json";
import fx_deep_sim from "./fixtures/deep_sim.json";
import fx_wargame_competitors from "./fixtures/wargame_competitors.json";
import fx_wargame_sim from "./fixtures/wargame_sim.json";
import fx_memory from "./fixtures/memory.json";
import fx_memory_details from "./fixtures/memory_details.json";
import fx_ticker from "./fixtures/ticker.json";
import fx_chat_sessions from "./fixtures/chat_sessions.json";
import fx_sim_sessions from "./fixtures/sim_sessions.json";

const clone = (v) => (typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

// Pick a detail record out of a {id: record} map, tolerant of id type.
const pickDetail = (map, id) => {
  if (!map) return null;
  if (map[id] !== undefined) return clone(map[id]);
  if (map[String(id)] !== undefined) return clone(map[String(id)]);
  const vals = Object.values(map);
  return vals.length ? clone(vals[0]) : null;
};

const getToken = () => localStorage.getItem("cco-token");

const authHeaders = (extra = {}) => {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...extra };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const authFetch = async (url, opts = {}) => {
  const res = await fetch(url, {
    ...opts,
    headers: authHeaders(opts.headers),
  });
  if (res.status === 401) {
    localStorage.removeItem("cco-token");
    localStorage.removeItem("cco-user");
    window.dispatchEvent(new Event("cco-logout"));
  }
  return res;
};

// Try a GET and parse JSON; on any failure return the provided fixture.
// `mut(json)` can post-process a successful live response if needed.
const getOrFixture = async (endpoint, fixture, mut = null) => {
  try {
    const res = await authFetch(prepareURL(endpoint));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return mut ? mut(data) : data;
  } catch {
    return clone(fixture);
  }
};

// Try a POST and parse JSON; on any failure return the provided fallback.
const postOrFixture = async (endpoint, body, fixture) => {
  try {
    const res = await authFetch(prepareURL(endpoint), { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return typeof fixture === "function" ? fixture() : clone(fixture);
  }
};

// ── Auth ──────────────────────────────────────────────────────────

// Demo login used when no backend is reachable (e.g. static GitHub Pages
// deploy). Accepts any username/password and issues a local-only session.
const demoLogin = (username) => {
  const data = {
    access_token: "demo-token",
    user: {
      username: username || "demo",
      full_name: username || "Demo User",
      role: "business_owner",
      access_role: "owner",
    },
  };
  localStorage.setItem("cco-token", data.access_token);
  localStorage.setItem("cco-user", JSON.stringify(data.user));
  return data;
};

export const loginUser = async (username, password) => {
  try {
    const res = await authFetch(prepareURL("/api/auth/login"), {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error("backend-rejected");
    const data = await res.json();
    localStorage.setItem("cco-token", data.access_token);
    localStorage.setItem("cco-user", JSON.stringify(data.user));
    return data;
  } catch {
    // Backend unreachable or rejected — fall back to a local demo session so
    // the app is usable as a static frontend-only deploy.
    return demoLogin(username);
  }
};

export const registerUser = async (username, password, full_name, secret_key) => {
  try {
    const res = await authFetch(prepareURL("/api/auth/register"), {
      method: "POST",
      body: JSON.stringify({ username, password, full_name, secret_key }),
    });
    if (!res.ok) throw new Error("backend-rejected");
    const data = await res.json();
    localStorage.setItem("cco-token", data.access_token);
    localStorage.setItem("cco-user", JSON.stringify(data.user));
    return data;
  } catch {
    return demoLogin(username || full_name);
  }
};

export const logoutUser = () => {
  localStorage.removeItem("cco-token");
  localStorage.removeItem("cco-user");
};

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem("cco-user")); } catch { return null; }
};

export const isAuthenticated = () => !!getToken();

// ── CXO home / KPIs / signals ─────────────────────────────────────

export const fetchHomeCards = async (cxoId = 1) =>
  getOrFixture(`/api/cxo/${cxoId}/home`, fx_home);

export const fetchAttention = async (cxoId = 1, category = "all") => {
  const endpoint = !category || category === "all"
    ? `/api/cxo/${cxoId}/attention`
    : `/api/cxo/${cxoId}/attention?category=${encodeURIComponent(category)}`;
  const all = await getOrFixture(endpoint, fx_attention);
  // In DEMO mode the fixture holds every item — filter client-side.
  if (category && category !== "all" && Array.isArray(all)) {
    const filtered = all.filter((it) => (it.category || "").toLowerCase() === category.toLowerCase());
    return filtered.length ? filtered : all;
  }
  return all;
};

export const fetchAttentionCategories = async (cxoId = 1) =>
  getOrFixture(`/api/cxo/${cxoId}/attention/categories`, fx_attention_categories);

export const fetchAttentionGroups = async (cxoId = 1) =>
  getOrFixture(`/api/cxo/${cxoId}/attention/groups`, fx_attention_groups);

export const fetchKPIs = async (cxoId = 1) =>
  getOrFixture(`/api/cxo/${cxoId}/kpis`, fx_kpis);

export const fetchSignals = async (cxoId = 1) =>
  getOrFixture(`/api/cxo/${cxoId}/signals`, fx_signals);

export const fetchSignalDetail = async (signalId, cxoId = 1) =>
  getOrFixture(`/api/cxo/${cxoId}/signals/${signalId}`, pickDetail(fx_signal_details, signalId));

// ── Chat (LLM) ────────────────────────────────────────────────────

const DEMO_NOTE = "_This is a static demo build with no live AI backend, so this is a canned illustrative response. Connect the CCO·OS backend to get real, context-aware answers._";

const cannedChatReply = (message) =>
  `Here's how I'd approach **"${(message || "your question").slice(0, 120)}"**:\n\n` +
  `- **Read on the signal** — the current data points to a mix of competitive and margin pressure worth watching this quarter.\n` +
  `- **Recommended move** — tighten pricing guardrails on the exposed packets while protecting win-rate on strategic accounts.\n` +
  `- **What to watch** — realization vs. plan, leakage trend, and any AutoZone re-staging.\n\n${DEMO_NOTE}`;

// Stream a string to onChunk in small pieces to mimic token streaming.
const streamText = async (text, onChunk, { chunkSize = 3, delay = 12 } = {}) => {
  const words = text.split(/(\s+)/);
  let buf = "";
  for (let i = 0; i < words.length; i++) {
    buf += words[i];
    if (i % chunkSize === 0 || i === words.length - 1) {
      if (onChunk) onChunk(buf);
      buf = "";
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  if (buf && onChunk) onChunk(buf);
};

export const chatWithAgent = async (message, { history = null, signal_context = null, session_id = null, section_context = null, view_context = null, provider = null } = {}) => {
  const url = prepareURL("/api/chat");
  const body = { message, cxo_id: 1 };
  if (session_id) body.session_id = session_id;
  if (history && history.length > 0) body.history = history;
  if (signal_context) body.signal_context = signal_context;
  if (section_context) body.section_context = section_context;
  if (view_context) body.view_context = view_context;
  if (provider) body.provider = provider;
  try {
    const res = await authFetch(url, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) throw new Error("Failed to chat with agent");
    return res.json();
  } catch {
    return { reply: cannedChatReply(message), session_id: session_id || "demo-session" };
  }
};

/** Streaming chat — onChunk(text), onSession(id), onDone(), onError(e). */
export const chatWithAgentStream = async (message, {
  history = null, signal_context = null, session_id = null, section_context = null, view_context = null, document_context = null, provider = null,
  onChunk, onSession, onDone, onError,
} = {}) => {
  const url = prepareURL("/api/chat/stream");
  const body = { message, cxo_id: 1 };
  if (session_id) body.session_id = session_id;
  if (history && history.length > 0) body.history = history;
  if (signal_context) body.signal_context = signal_context;
  if (section_context) body.section_context = section_context;
  if (view_context) body.view_context = view_context;
  if (document_context) body.document_context = document_context;
  if (provider) body.provider = provider;

  let doneFired = false;
  const fireDone = () => { if (!doneFired && onDone) { doneFired = true; onDone(); } };
  try {
    let res;
    for (let _r = 0; _r < 4; _r++) {
      res = await authFetch(url, { method: "POST", body: JSON.stringify(body) });
      if (res.status === 429 && _r < 3) { await new Promise(r => setTimeout(r, (2 ** _r) * 1000)); continue; }
      break;
    }
    if (!res.ok || !res.body) throw new Error("Stream failed to open");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const evt of events) {
        const line = evt.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const data = JSON.parse(payload);
          if (data.type === "session" && onSession) onSession(data.session_id);
          else if (data.type === "chunk" && onChunk) onChunk(data.text || "");
          else if (data.type === "done") fireDone();
          else if (data.type === "error" && onError) onError(new Error(data.error));
        } catch { /* ignore parse errors */ }
      }
    }
    fireDone();
  } catch {
    // DEMO fallback — stream a canned reply so the chat panel still works.
    if (onSession) onSession(session_id || "demo-session");
    await streamText(cannedChatReply(message), onChunk);
    fireDone();
  }
};

export const fetchChatSessions = async (cxoId = 1) =>
  getOrFixture(`/api/chat-history/sessions?cxo_id=${cxoId}`, fx_chat_sessions);

export const fetchChatMessages = async (sessionId) => {
  try {
    const res = await authFetch(prepareURL(`/api/chat-history/sessions/${sessionId}/messages`));
    if (!res.ok) throw new Error("Failed to fetch chat messages");
    return res.json();
  } catch { return []; }
};

export const deleteChatSession = async (sessionId) => {
  try {
    const res = await authFetch(prepareURL(`/api/chat-history/sessions/${sessionId}`), { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete chat session");
    return res.json();
  } catch { return { ok: true }; }
};

export const fetchSimSessions = async (cxoId = 1) =>
  getOrFixture(`/api/sim-history/sessions?cxo_id=${cxoId}`, fx_sim_sessions);

export const fetchSimMessages = async (sessionId) => {
  try {
    const res = await authFetch(prepareURL(`/api/sim-history/sessions/${sessionId}/messages`));
    if (!res.ok) throw new Error("Failed to fetch sim messages");
    return res.json();
  } catch { return []; }
};

export const createSimSession = async (title = "New Simulation", cxoId = 1) => {
  try {
    const res = await authFetch(prepareURL("/api/sim-history/sessions"), {
      method: "POST",
      body: JSON.stringify({ cxo_id: cxoId, title }),
    });
    if (!res.ok) throw new Error("Failed to create sim session");
    return res.json();
  } catch { return { id: `demo-${Date.now()}`, title, cxo_id: cxoId }; }
};

export const saveSimMessage = async (sessionId, role, text) => {
  try {
    const res = await authFetch(prepareURL(`/api/sim-history/sessions/${sessionId}/messages`), {
      method: "POST",
      body: JSON.stringify({ role, text }),
    });
    if (!res.ok) throw new Error("Failed to save sim message");
    return res.json();
  } catch { return { id: `demo-${Date.now()}`, session_id: sessionId, role, text }; }
};

export const deleteSimSession = async (sessionId) => {
  try {
    const res = await authFetch(prepareURL(`/api/sim-history/sessions/${sessionId}`), { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete sim session");
    return res.json();
  } catch { return { ok: true }; }
};

// Read an uploaded document client-side when there's no backend to parse it.
const readFileText = (file) => new Promise((resolve) => {
  try {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  } catch { resolve(""); }
});

export const uploadDocument = async (file) => {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch(prepareURL("/api/upload"), { method: "POST", headers, body: formData });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || "Upload failed"); }
    return res.json();
  } catch {
    // DEMO — extract text locally where possible (txt/csv/md/json).
    const isText = /\.(txt|csv|md|json|log|tsv)$/i.test(file.name || "");
    const text = isText ? await readFileText(file) : "";
    return {
      filename: file.name,
      text_content: text || `[${file.name}] attached — document text extraction requires the backend in this demo build.`,
      char_count: text.length,
    };
  }
};

// ── Fast simulation (LLM) ─────────────────────────────────────────

const cannedFastSim = (query) => ({
  query,
  answer:
    `**Simulation read — "${(query || "").slice(0, 100)}"**\n\n` +
    `Modeled impact points to a favorable but guarded outcome: profit lift in the low-to-mid range with margin held near plan, ` +
    `assuming disciplined pricing guardrails and no material win-rate erosion on strategic packets.\n\n` +
    `- **Upside:** margin recovery, leakage reduction\n- **Risk:** competitive response on exposed lanes\n- **Confidence:** P50 · illustrative\n\n${DEMO_NOTE}`,
  narrative: `Illustrative fast-simulation result for "${(query || "").slice(0, 80)}". ${DEMO_NOTE}`,
});

export const runFastSimulation = async (query) => {
  const url = prepareURL("/api/simulation/fast/v2");
  try {
    const res = await authFetch(url, { method: "POST", body: JSON.stringify({ query, cxo_id: 1 }) });
    if (!res.ok) throw new Error("Failed to run fast simulation");
    return res.json();
  } catch { return cannedFastSim(query); }
};

export const streamFastSimulation = async (query, { history = null, document_context = null, onChunk, onDone, onError } = {}) => {
  const url = prepareURL("/api/simulation/fast/stream");
  const body = { query, cxo_id: 1 };
  if (history && history.length > 0) body.history = history;
  if (document_context) body.document_context = document_context;
  let doneFired = false;
  const fireDone = () => { if (!doneFired && onDone) { doneFired = true; onDone(); } };
  try {
    const res = await authFetch(url, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok || !res.body) throw new Error("Stream failed");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const evt of events) {
        const line = evt.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const data = JSON.parse(payload);
          if (data.type === "chunk" && onChunk) onChunk(data.text || "");
          else if (data.type === "done") fireDone();
          else if (data.type === "error" && onError) onError(new Error(data.error));
        } catch { /* ignore */ }
      }
    }
    fireDone();
  } catch {
    // DEMO fallback — stream a canned analysis.
    await streamText(cannedFastSim(query).answer, onChunk);
    fireDone();
  }
};

// ── Deep simulation / scenarios ───────────────────────────────────

export const fetchLevers = async () =>
  getOrFixture("/api/simulation/levers", fx_levers);

export const fetchScenarios = async (cxoId = 1) =>
  getOrFixture(`/api/simulation/scenarios?cxo_id=${cxoId}`, fx_scenarios);

export const loadScenario = async (scenarioId) =>
  getOrFixture(`/api/simulation/scenarios/${scenarioId}`, pickDetail(fx_scenario_details, scenarioId));

export const runDeepSimulation = async (payload) =>
  postOrFixture("/api/simulation/deep", payload, fx_deep_sim);

export const saveScenario = async (payload) =>
  postOrFixture("/api/simulation/scenarios/save", payload, () => ({
    id: `demo-${Date.now()}`, ...payload,
  }));

// ── ABM / market ──────────────────────────────────────────────────

export const fetchMarketSignals = async () =>
  getOrFixture("/api/abm/signals", fx_abm_signals);

export const fetchMarketSignalDetail = async (signalId) =>
  getOrFixture(`/api/abm/signals/${signalId}`, pickDetail(fx_abm_signal_details, signalId));

export const fetchABMInsights = async () =>
  getOrFixture("/api/abm/insights", fx_abm_insights);

export const fetchEntInsights = async () =>
  getOrFixture("/api/enterprise/insights", fx_ent_insights);

// ── Objective 2 · Digital Deal Analyser ───────────────────────────

export const fetchEntSnapshot = async () =>
  getOrFixture("/api/enterprise/snapshot", fx_ent_snapshot);

export const fetchDAOverview = async () =>
  getOrFixture("/api/enterprise/da-overview", fx_da_overview);

export const fetchPacket = async (packetId) =>
  getOrFixture(`/api/enterprise/packets/${packetId}`, pickDetail(fx_packet_details, packetId));

export const fetchDealLevers = async () =>
  getOrFixture("/api/enterprise/deal-levers", fx_deal_levers);

export const fetchEntInitiatives = async () =>
  getOrFixture("/api/enterprise/initiatives", fx_ent_initiatives);

export const simulateDealWorkbench = async (levers) =>
  postOrFixture("/api/enterprise/simulate", { levers }, fx_deal_workbench_sim);

export const createEntInitiative = async (payload) =>
  postOrFixture("/api/enterprise/initiatives", payload, () => ({
    id: `demo-${Date.now()}`, ...payload,
  }));

// === Memory ===
export const fetchMemoryItems = async (cxoId = 1) =>
  getOrFixture(`/api/cxo/${cxoId}/memory`, fx_memory);

export const fetchMemoryDetail = async (itemId) =>
  getOrFixture(`/api/memory/${itemId}`, pickDetail(fx_memory_details, itemId));

export const deleteMemoryItem = async (itemId) => {
  try {
    const res = await authFetch(prepareURL(`/api/memory/${itemId}`), { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete memory item");
    return res.json();
  } catch { return { ok: true }; }
};

export const saveSimulationAsMemory = async (payload) =>
  postOrFixture("/api/memory/save-from-simulation", payload, () => ({
    id: `demo-${Date.now()}`, ...payload,
  }));

export const fetchTicker = async () =>
  getOrFixture("/api/market/ticker", fx_ticker);

export const fetchWargameCompetitors = async () =>
  getOrFixture("/api/wargame/competitors", fx_wargame_competitors);

// ── Alignment brief (LLM) ─────────────────────────────────────────

const cannedBrief = (stakeholder) =>
  `## Alignment Brief${stakeholder && stakeholder !== "general" ? ` — for ${stakeholder}` : ""}\n\n` +
  `**Situation.** The signal warrants a measured, proactive stance this quarter.\n\n` +
  `**Recommendation.** Move on the balanced option: recover margin while protecting win-rate on strategic accounts, with pricing guardrails tightened on the exposed packets.\n\n` +
  `**Why now.** Waiting risks leakage compounding and a harder competitive position next quarter.\n\n` +
  `**Ask.** Sign-off to route the guardrail directive for committee approval.\n\n${DEMO_NOTE}`;

export const streamAlignmentBrief = async ({ context_type, context_data, stakeholder = "general", tone = "confident", length = "standard", emphasis = null, onChunk, onDone, onError } = {}) => {
  const url = prepareURL("/api/brief/generate/stream");
  const body = { cxo_id: 1, context_type, context_data, stakeholder, tone, length };
  if (emphasis) body.emphasis = emphasis;
  let doneFired = false;
  const fireDone = () => { if (!doneFired && onDone) { doneFired = true; onDone(); } };
  try {
    const res = await authFetch(url, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok || !res.body) throw new Error("Brief stream failed");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const evt of events) {
        const line = evt.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const data = JSON.parse(payload);
          if (data.type === "chunk" && onChunk) onChunk(data.text || "");
          else if (data.type === "done") fireDone();
          else if (data.type === "error" && onError) onError(new Error(data.error));
        } catch { /* ignore */ }
      }
    }
    fireDone();
  } catch {
    // DEMO fallback — stream a canned brief.
    await streamText(cannedBrief(stakeholder), onChunk, { chunkSize: 2, delay: 14 });
    fireDone();
  }
};

export const lookupBrief = async ({ context_type, context_data, stakeholder = "general" }) => {
  try {
    const params = new URLSearchParams({ context_type, context_data: JSON.stringify(context_data), stakeholder });
    const res = await authFetch(prepareURL(`/api/brief/lookup?${params}`));
    if (!res.ok) return { found: false };
    return res.json();
  } catch { return { found: false }; }
};

export const saveBrief = async ({ context_type, context_data, stakeholder, tone, length, brief_data }) => {
  try {
    const res = await authFetch(prepareURL("/api/brief/save"), {
      method: "POST",
      body: JSON.stringify({ cxo_id: 1, context_type, context_data, stakeholder, tone, length, brief_data }),
    });
    if (!res.ok) throw new Error("Failed to save brief");
    return res.json();
  } catch { return { ok: true }; }
};

export const fetchWargameSim = async (payload) =>
  postOrFixture("/api/wargame/simulate", payload, () => {
    // Reflect the requested competitor into the sample so the UI stays coherent.
    const base = clone(fx_wargame_sim);
    const comp = (fx_wargame_competitors || []).find((c) => c.id === payload?.competitor_id);
    if (comp) base.competitor_name = comp.name;
    return base;
  });
