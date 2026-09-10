// ── Demo Mode ────────────────────────────────────────────────────────────────
// Activated by visiting the app with ?demo=1 in the URL.
// Persists for the browser session (sessionStorage) so navigation keeps it on.
// While active, ALL entity writes are intercepted and never reach the database,
// so demo visitors can explore and click anything without changing live data.

const STORAGE_KEY = "base44_demo_mode";

export function isDemoMode() {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1" || params.get("demo") === "true") {
      sessionStorage.setItem(STORAGE_KEY, "true");
      return true;
    }
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function exitDemoMode() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  window.location.reload();
}

// Entity write operations blocked in demo mode
const WRITE_OPS = ["create", "bulkCreate", "update", "bulkUpdate", "updateMany", "deleteMany", "delete"];
const wrappedEntities = new WeakSet();

function blockEntityWrites(entity) {
  if (wrappedEntities.has(entity)) return;
  wrappedEntities.add(entity);
  for (const op of WRITE_OPS) {
    if (typeof entity[op] !== "function") continue;
    entity[op] = async (...args) => {
      console.info(`[Demo Mode] blocked ${op} — nothing is saved in demo mode`);
      // Return realistic fake results so UI flows continue smoothly
      if (op === "create") return { id: `demo-${Date.now()}`, ...(args[0] || {}) };
      if (op === "bulkCreate") return (args[0] || []).map((r) => ({ id: `demo-${Date.now()}`, ...r }));
      if (op === "update") return { id: args[0], ...(args[1] || {}) };
      if (op === "bulkUpdate") return args[0] || [];
      if (op === "updateMany") return { modified: 0 };
      return { deleted: 0 };
    };
  }
}

export function applyDemoMode(client) {
  if (!isDemoMode() || !client?.entities) return;
  client.entities = new Proxy(client.entities, {
    get(target, name) {
      const entity = target[name];
      if (entity && typeof entity === "object") blockEntityWrites(entity);
      return entity;
    },
  });
}