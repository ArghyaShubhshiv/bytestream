const PISTON_URL = process.env.PISTON_URL ?? "http://localhost:2000";

export async function checkPistonHealth(): Promise<void> {
  try {
    const { default: fetch } = await import("node-fetch");
    const res = await fetch(`${PISTON_URL}/api/v2/runtimes`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const runtimes = await res.json() as Array<{ language: string; version: string }>;
      console.log(`✅ Piston healthy — ${runtimes.length} runtimes available at ${PISTON_URL}`);
    } else {
      console.warn(`⚠️  Piston returned HTTP ${res.status}. Code execution may not work.`);
    }
  } catch (err) {
    console.warn(`⚠️  Piston not reachable at ${PISTON_URL}. Code execution will fail until Piston is running.`);
  }
}
