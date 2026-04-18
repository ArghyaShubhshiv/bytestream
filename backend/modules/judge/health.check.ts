// Quick health check utility — call this on server startup to confirm
// Piston is reachable and the required runtimes are installed.

import { SUPPORTED_LANGUAGES } from "./piston.service.js";

const PISTON_URL = process.env.PISTON_URL || "http://localhost:2000";

export async function checkPistonHealth(): Promise<void> {
  let runtimes: { language: string; version: string }[] = [];

  try {
    const res = await fetch(`${PISTON_URL}/api/v2/runtimes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    runtimes = await res.json() as { language: string; version: string }[];
  } catch {
    console.warn(
      `⚠️  [Piston] Cannot reach Piston at ${PISTON_URL}. ` +
      `Code execution will fail until Piston is running. ` +
      `Run: docker compose up -d`
    );
    return;
  }

  const installedSet = new Set(runtimes.map((r) => `${r.language}@${r.version}`));

  for (const [key, { pistonName, version }] of Object.entries(SUPPORTED_LANGUAGES)) {
    const tag = `${pistonName}@${version}`;
    if (!installedSet.has(tag)) {
      console.warn(
        `⚠️  [Piston] Runtime NOT installed: ${key} (${tag}). ` +
        `Run: bash install-runtimes.sh`
      );
    } else {
      console.log(`✅ [Piston] Runtime ready: ${key} (${tag})`);
    }
  }
}
