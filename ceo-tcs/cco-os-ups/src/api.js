const BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : "http://localhost:8000";

export const prepareURL = (endpoint) => `${BASE_URL}${endpoint}`;

// Default companion LLM provider ("gemini" | "slm"). UI toggle overrides per-request.
export const DEFAULT_LLM_PROVIDER = (import.meta.env.VITE_LLM_PROVIDER || "gemini").toLowerCase() === "slm" ? "slm" : "gemini";

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
  const res = await authFetch(prepareURL("/api/auth/register"), {
    method: "POST",
    body: JSON.stringify({ username, password, full_name, secret_key }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed");
  }
  const data = await res.json();
  localStorage.setItem("cco-token", data.access_token);
  localStorage.setItem("cco-user", JSON.stringify(data.user));
  return data;
};

export const logoutUser = () => {
  localStorage.removeItem("cco-token");
  localStorage.removeItem("cco-user");
  window.dispatchEvent(new Event("cco-logout"));
};

export const getStoredUser = () => {
  try {
    const u = localStorage.getItem("cco-user");
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const isAuthenticated = () => !!getToken();

export const fetchHomeCards = async (cxoId = 1) => {
  const res = await authFetch(prepareURL(`/api/cxo/${cxoId}/home`));
  if (!res.ok) throw new Error("Failed to fetch home cards");
  return res.json();
};

export const fetchAttention = async (cxoId = 1, category = "all") => {
  const url = category === "all"
    ? `/api/cxo/${cxoId}/attention`
    : `/api/cxo/${cxoId}/attention?category=${encodeURIComponent(category)}`;
  const res = await authFetch(prepareURL(url));
  if (!res.ok) throw new Error("Failed to fetch attention items");
  return res.json();
};

export const fetchAttentionCategories = async (cxoId = 1) => {
  const res = await authFetch(prepareURL(`/api/cxo/${cxoId}/attention/categories`));
  if (!res.ok) throw new Error("Failed to fetch attention categories");
  return res.json();
};

export const fetchAttentionGroups = async (cxoId = 1) => {
  const res = await authFetch(prepareURL(`/api/cxo/${cxoId}/attention/groups`));
  if (!res.ok) throw new Error("Failed to fetch attention groups");
  return res.json();
};

export const fetchKPIs = async (cxoId = 1) => {
  const res = await authFetch(prepareURL(`/api/cxo/${cxoId}/kpis`));
  if (!res.ok) throw new Error("Failed to fetch kpis");
  return res.json();
};

export const fetchSignals = async (cxoId = 1) => {
  const res = await authFetch(prepareURL(`/api/cxo/${cxoId}/signals`));
  if (!res.ok) throw new Error("Failed to fetch signals");
  return res.json();
};

export const fetchSignalDetail = async (signalId, cxoId = 1) => {
  const res = await authFetch(prepareURL(`/api/cxo/${cxoId}/signals/${signalId}`));
  if (!res.ok) throw new Error("Failed to fetch signal detail");
  return res.json();
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
  const res = await authFetch(url, {
    method: "POST",
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error("Failed to chat with agent");
  return res.json();
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
  } catch (e) {
    if (onError) onError(e);
  }
};

export const fetchChatSessions = async (cxoId = 1) => {
  const res = await authFetch(prepareURL(`/api/chat-history/sessions?cxo_id=${cxoId}`));
  if (!res.ok) throw new Error("Failed to fetch chat sessions");
  return res.json();
};

export const fetchChatMessages = async (sessionId) => {
  const res = await authFetch(prepareURL(`/api/chat-history/sessions/${sessionId}/messages`));
  if (!res.ok) throw new Error("Failed to fetch chat messages");
  return res.json();
};

export const deleteChatSession = async (sessionId) => {
  const res = await authFetch(prepareURL(`/api/chat-history/sessions/${sessionId}`), { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete chat session");
  return res.json();
};

export const fetchSimSessions = async (cxoId = 1) => {
  const res = await authFetch(prepareURL(`/api/sim-history/sessions?cxo_id=${cxoId}`));
  if (!res.ok) throw new Error("Failed to fetch sim sessions");
  return res.json();
};

export const fetchSimMessages = async (sessionId) => {
  const res = await authFetch(prepareURL(`/api/sim-history/sessions/${sessionId}/messages`));
  if (!res.ok) throw new Error("Failed to fetch sim messages");
  return res.json();
};

export const createSimSession = async (title = "New Simulation", cxoId = 1) => {
  const res = await authFetch(prepareURL("/api/sim-history/sessions"), {
    method: "POST",
    body: JSON.stringify({ cxo_id: cxoId, title }),
  });
  if (!res.ok) throw new Error("Failed to create sim session");
  return res.json();
};

export const saveSimMessage = async (sessionId, role, text) => {
  const res = await authFetch(prepareURL(`/api/sim-history/sessions/${sessionId}/messages`), {
    method: "POST",
    body: JSON.stringify({ role, text }),
  });
  if (!res.ok) throw new Error("Failed to save sim message");
  return res.json();
};

export const deleteSimSession = async (sessionId) => {
  const res = await authFetch(prepareURL(`/api/sim-history/sessions/${sessionId}`), { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete sim session");
  return res.json();
};

export const uploadDocument = async (file) => {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(prepareURL("/api/upload"), { method: "POST", headers, body: formData });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || "Upload failed"); }
  return res.json();
};

export const runFastSimulation = async (query) => {
  const url = prepareURL("/api/simulation/fast/v2");
  const res = await authFetch(url, {
    method: "POST",
    body: JSON.stringify({ query, cxo_id: 1 })
  });
  if (!res.ok) throw new Error("Failed to run fast simulation");
  return res.json();
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
  } catch (e) {
    if (onError) onError(e);
  }
};

export const fetchLevers = async () => {
  const res = await authFetch(prepareURL("/api/simulation/levers"));
  if (!res.ok) throw new Error("Failed to fetch levers");
  return res.json();
};

export const fetchScenarios = async (cxoId = 1) => {
  const res = await authFetch(prepareURL(`/api/simulation/scenarios?cxo_id=${cxoId}`));
  if (!res.ok) throw new Error("Failed to fetch scenarios");
  return res.json();
};

export const loadScenario = async (scenarioId) => {
  const res = await authFetch(prepareURL(`/api/simulation/scenarios/${scenarioId}`));
  if (!res.ok) throw new Error("Failed to load scenario");
  return res.json();
};

export const runDeepSimulation = async (payload) => {
  const url = prepareURL("/api/simulation/deep");
  const res = await authFetch(url, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to run deep simulation");
  return res.json();
};

export const saveScenario = async (payload) => {
  const url = prepareURL("/api/simulation/scenarios/save");
  const res = await authFetch(url, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to save scenario");
  return res.json();
};

export const fetchMarketSignals = async () => {
  const res = await authFetch(prepareURL("/api/abm/signals"));
  if (!res.ok) throw new Error("Failed to fetch market signals");
  return res.json();
};

export const fetchMarketSignalDetail = async (signalId) => {
  const res = await authFetch(prepareURL(`/api/abm/signals/${signalId}`));
  if (!res.ok) throw new Error("Failed to fetch market signal detail");
  return res.json();
};

export const fetchABMInsights = async () => {
  const res = await authFetch(prepareURL("/api/abm/insights"));
  if (!res.ok) throw new Error("Failed to fetch ABM insights");
  return res.json();
};

export const fetchEntInsights = async () => {
  const res = await authFetch(prepareURL("/api/enterprise/insights"));
  if (!res.ok) throw new Error("Failed to fetch enterprise insights");
  return res.json();
};

// === Objective 2 · Digital Deal Analyser ===
export const fetchEntSnapshot = async () => {
  const res = await authFetch(prepareURL("/api/enterprise/snapshot"));
  if (!res.ok) throw new Error("Failed to fetch enterprise snapshot");
  return res.json();
};

export const fetchDAOverview = async () => {
  const res = await authFetch(prepareURL("/api/enterprise/da-overview"));
  if (!res.ok) throw new Error("Failed to fetch DA overview");
  return res.json();
};

export const fetchPacket = async (packetId) => {
  const res = await authFetch(prepareURL(`/api/enterprise/packets/${packetId}`));
  if (!res.ok) throw new Error("Failed to fetch packet");
  return res.json();
};

export const fetchDealLevers = async () => {
  const res = await authFetch(prepareURL("/api/enterprise/deal-levers"));
  if (!res.ok) throw new Error("Failed to fetch deal levers");
  return res.json();
};

export const fetchEntInitiatives = async () => {
  const res = await authFetch(prepareURL("/api/enterprise/initiatives"));
  if (!res.ok) throw new Error("Failed to fetch enterprise initiatives");
  return res.json();
};

export const simulateDealWorkbench = async (levers) => {
  const res = await authFetch(prepareURL("/api/enterprise/simulate"), {
    method: "POST",
    body: JSON.stringify({ levers }),
  });
  if (!res.ok) throw new Error("Failed to run deal workbench simulation");
  return res.json();
};

export const createEntInitiative = async (payload) => {
  const res = await authFetch(prepareURL("/api/enterprise/initiatives"), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create enterprise initiative");
  return res.json();
};

// === Memory ===
export const fetchMemoryItems = async (cxoId = 1) => {
  const res = await authFetch(prepareURL(`/api/cxo/${cxoId}/memory`));
  if (!res.ok) throw new Error("Failed to fetch memory items");
  return res.json();
};

export const fetchMemoryDetail = async (itemId) => {
  const res = await authFetch(prepareURL(`/api/memory/${itemId}`));
  if (!res.ok) throw new Error("Failed to fetch memory detail");
  return res.json();
};

export const deleteMemoryItem = async (itemId) => {
  const res = await authFetch(prepareURL(`/api/memory/${itemId}`), { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete memory item");
  return res.json();
};

export const saveSimulationAsMemory = async (payload) => {
  const res = await authFetch(prepareURL("/api/memory/save-from-simulation"), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save simulation as memory");
  return res.json();
};

export const fetchTicker = async () => {
  const res = await authFetch(prepareURL("/api/market/ticker"));
  if (!res.ok) throw new Error("Failed to fetch ticker");
  return res.json();
};

export const fetchWargameCompetitors = async () => {
  const res = await authFetch(prepareURL("/api/wargame/competitors"));
  if (!res.ok) throw new Error("Failed to fetch wargame competitors");
  return res.json();
};

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
  } catch (e) {
    if (onError) onError(e);
  }
};

export const lookupBrief = async ({ context_type, context_data, stakeholder = "general" }) => {
  const params = new URLSearchParams({ context_type, context_data: JSON.stringify(context_data), stakeholder });
  const res = await authFetch(prepareURL(`/api/brief/lookup?${params}`));
  if (!res.ok) return { found: false };
  return res.json();
};

export const saveBrief = async ({ context_type, context_data, stakeholder, tone, length, brief_data }) => {
  const res = await authFetch(prepareURL("/api/brief/save"), {
    method: "POST",
    body: JSON.stringify({ cxo_id: 1, context_type, context_data, stakeholder, tone, length, brief_data }),
  });
  if (!res.ok) throw new Error("Failed to save brief");
  return res.json();
};

export const fetchWargameSim = async (payload) => {
  const res = await authFetch(prepareURL("/api/wargame/simulate"), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to run wargame simulation");
  return res.json();
};
