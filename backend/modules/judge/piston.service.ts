const PISTON_URL = process.env.PISTON_URL || "http://localhost:2000";

// Pinned runtime versions — must match what you install via `piston install`
export const SUPPORTED_LANGUAGES: Record<string, { pistonName: string; version: string }> = {
  python:     { pistonName: "python",     version: "3.10.0" },
  javascript: { pistonName: "javascript", version: "18.15.0" },
  java:       { pistonName: "java",       version: "15.0.2" },
  cpp:        { pistonName: "c++",        version: "10.2.0" },
};

export interface RunResult {
  output: string;
  error: string;
  timedOut: boolean;
  exitCode: number;
  // True when the Piston compile phase failed (as opposed to a runtime crash).
  // judge.service.ts uses this to distinguish "Compile Error" from "Runtime Error"
  // without fragile stderr string-matching.
  isCompileError: boolean;
}

export async function runCode(
  language: string,
  code: string,
  stdin: string
): Promise<RunResult> {
  const runtime = SUPPORTED_LANGUAGES[language];
  if (!runtime) {
    return {
      output: "",
      error: `Unsupported language: "${language}". Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}`,
      timedOut: false,
      exitCode: 1,
      isCompileError: false,
    };
  }

  let response: Response;
  try {
    response = await fetch(`${PISTON_URL}/api/v2/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: runtime.pistonName,
        version: runtime.version,
        files: [{ content: code }],
        stdin,
        run_timeout: 5000,
        compile_timeout: 10000,
        run_memory_limit: 134217728,
      }),
    });
  } catch {
    return {
      output: "",
      error: "Could not reach the code execution server. Is Piston running? (docker compose up)",
      timedOut: false,
      exitCode: 1,
      isCompileError: false,
    };
  }

  if (!response.ok) {
    return {
      output: "",
      error: `Piston server error: HTTP ${response.status}`,
      timedOut: false,
      exitCode: 1,
      isCompileError: false,
    };
  }

  const data = (await response.json()) as {
    message?: string;
    compile?: { stdout: string; stderr: string; code: number | null };
    run: { stdout: string; stderr: string; code: number | null; signal?: string };
  };

  if (data.message) {
    return {
      output: "",
      error: `Runtime not installed: ${data.message}. Run the install script first.`,
      timedOut: false,
      exitCode: 1,
      isCompileError: false,
    };
  }

  // Piston surfaces compile failures in the dedicated compile block.
  // This is authoritative — no need to re-detect via stderr pattern matching.
  if (data.compile && data.compile.code !== 0 && data.compile.stderr) {
    return {
      output: "",
      error: data.compile.stderr,
      timedOut: false,
      exitCode: data.compile.code ?? 1,
      isCompileError: true,
    };
  }

  const timedOut = data.run.signal === "SIGKILL";

  return {
    output: data.run.stdout ?? "",
    error: data.run.stderr ?? "",
    timedOut,
    exitCode: data.run.code ?? 0,
    isCompileError: false,
  };
}
