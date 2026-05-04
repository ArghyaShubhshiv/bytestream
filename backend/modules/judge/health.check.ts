const PISTON_BASE_URL = (
  process.env.PISTON_BASE_URL ||
  process.env.PISTON_URL?.replace(/\/api\/v2\/execute\/?$/, "") ||
  "http://localhost:2000"
).replace(/\/$/, "");
const REQUIRED_RUNTIMES = ["gcc", "python", "java"];

async function fetchRuntimes() {
  const res = await fetch(`${PISTON_BASE_URL}/api/v2/runtimes`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`Piston returned HTTP ${res.status}`);
  }
  return res.json() as Promise<Array<{ language: string; version: string }>>;
}

export async function checkPistonHealth(): Promise<void> {
  try {
    const runtimes = await fetchRuntimes();
    const available = new Set(runtimes.map((r) => r.language));
    const missing = REQUIRED_RUNTIMES.filter((lang) => !available.has(lang));
    if (missing.length > 0) {
      console.warn(
        `⚠️  Piston reachable at ${PISTON_BASE_URL}, but missing runtimes: ${missing.join(", ")}`
      );
      return;
    }
    console.log(`✅ Piston healthy - ${runtimes.length} runtimes available at ${PISTON_BASE_URL}`);
  } catch (err) {
    console.warn(`⚠️  Piston not reachable at ${PISTON_BASE_URL}. Code execution will fail until Piston is running.`);
  }
}

export async function assertCodeEngineReady(): Promise<void> {
  const runtimes = await fetchRuntimes();
  const available = new Set(runtimes.map((r) => r.language));
  const missing = REQUIRED_RUNTIMES.filter((lang) => !available.has(lang));
  if (missing.length > 0) {
    throw new Error(`Missing required runtimes: ${missing.join(", ")}`);
  }
}
