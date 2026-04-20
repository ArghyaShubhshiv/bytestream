import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const PISTON_URL = process.env.PISTON_URL || "http://localhost:2000";
const ALLOW_LOCAL_EXEC_FALLBACK =
  process.env.ALLOW_LOCAL_EXEC_FALLBACK === "true" || process.env.NODE_ENV !== "production";

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

const localRuntimeByLanguage: Record<string, { command: string; extension: string; compile?: string } | undefined> = {
  python: { command: "python3", extension: "py" },
  javascript: { command: "node", extension: "js" },
  cpp: { command: "g++", extension: "cpp", compile: "g++" },
};

async function runLocalFallback(language: string, code: string, stdin: string): Promise<RunResult | null> {
  if (!ALLOW_LOCAL_EXEC_FALLBACK) return null;

  const runtime = localRuntimeByLanguage[language];
  if (!runtime) return null;

  const tempFile = path.join(os.tmpdir(), `bytestream-${randomUUID()}.${runtime.extension}`);
  await fs.writeFile(tempFile, code, "utf8");

  // Compile if needed (e.g., for C++)
  if (runtime.compile) {
    const executablePath = tempFile.replace(/\.[^.]+$/, "");
    return await new Promise((resolve) => {
      const compiler = spawn(runtime.compile!, [tempFile, "-o", executablePath], {
        stdio: ["pipe", "pipe", "pipe"],
      });
      let compileStderr = "";

      compiler.stderr.on("data", (chunk) => {
        compileStderr += chunk.toString();
      });

      compiler.on("close", async (compileCode) => {
        if (compileCode !== 0) {
          try {
            await fs.unlink(tempFile);
            await fs.unlink(executablePath).catch(() => {});
          } catch {
            // Best-effort cleanup
          }
          resolve({
            output: "",
            error: compileStderr || `Compilation failed with exit code ${compileCode}`,
            timedOut: false,
            exitCode: compileCode ?? 1,
            isCompileError: true,
          });
          return;
        }

        // Compilation succeeded, now run the executable
        const child = spawn(executablePath, [], { stdio: ["pipe", "pipe", "pipe"] });
        let stdout = "";
        let stderr = "";
        let timedOut = false;

        const timer = setTimeout(() => {
          timedOut = true;
          child.kill("SIGKILL");
        }, 5000);

        child.stdout.on("data", (chunk) => {
          stdout += chunk.toString();
        });
        child.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });

        child.on("error", (err) => {
          clearTimeout(timer);
          resolve({
            output: "",
            error: `Runtime error: ${err.message}`,
            timedOut: false,
            exitCode: 1,
            isCompileError: false,
          });
        });

        child.on("close", async (runCode) => {
          clearTimeout(timer);
          try {
            await fs.unlink(tempFile);
            await fs.unlink(executablePath);
          } catch {
            // Best-effort cleanup
          }

          resolve({
            output: stdout,
            error: stderr,
            timedOut,
            exitCode: timedOut ? 1 : (runCode ?? 0),
            isCompileError: false,
          });
        });

        child.stdin.write(stdin ?? "");
        child.stdin.end();
      });
    });
  }

  // For interpreted languages (Python, JavaScript)
  return await new Promise((resolve) => {
    const child = spawn(runtime.command, [tempFile], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, 5000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        output: "",
        error: `Local ${language} runtime error: ${err.message}`,
        timedOut: false,
        exitCode: 1,
        isCompileError: false,
      });
    });

    child.on("close", async (code) => {
      clearTimeout(timer);
      try {
        await fs.unlink(tempFile);
      } catch {
        // Best-effort cleanup for tmp file.
      }

      resolve({
        output: stdout,
        error: stderr,
        timedOut,
        exitCode: timedOut ? 1 : (code ?? 0),
        isCompileError: false,
      });
    });

    child.stdin.write(stdin ?? "");
    child.stdin.end();
  });
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

  type PistonResponse = {
    message?: string;
    compile?: { stdout: string; stderr: string; code: number | null };
    run: { stdout: string; stderr: string; code: number | null; signal?: string };
  };

  const basePayload = {
    language: runtime.pistonName,
    files: [{ content: code }],
    stdin,
    run_timeout: 5000,
    compile_timeout: 10000,
    run_memory_limit: 134217728,
  };

  let data: PistonResponse | null = null;

  for (const withPinnedVersion of [true, false]) {
    const payload = withPinnedVersion
      ? { ...basePayload, version: runtime.version }
      : basePayload;

    let response: Response;
    try {
      response = await fetch(`${PISTON_URL}/api/v2/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      const localResult = await runLocalFallback(language, code, stdin);
      if (localResult) return localResult;

      return {
        output: "",
        error: "Could not reach the code execution server. Is Piston running? (docker compose up)",
        timedOut: false,
        exitCode: 1,
        isCompileError: false,
      };
    }

    if (response.ok) {
      data = await response.json() as PistonResponse;
      break;
    }

    const rawBody = await response.text();
    let message = rawBody.trim();

    try {
      const parsed = JSON.parse(rawBody) as { message?: string; error?: string };
      message = parsed.message || parsed.error || message;
    } catch {
      // Keep plain-text fallback from response body
    }

    const runtimeUnknown =
      response.status === 400 &&
      /runtime.*unknown|unknown runtime|version.*unknown|unknown version/i.test(message);

    if (withPinnedVersion && runtimeUnknown) {
      // Try again without explicitly pinning version so Piston can choose latest installed runtime.
      continue;
    }

    if (runtimeUnknown) {
      const localResult = await runLocalFallback(language, code, stdin);
      if (localResult) return localResult;
    }

    const localResult = await runLocalFallback(language, code, stdin);
    if (localResult) return localResult;

    return {
      output: "",
      error: message
        ? `Piston server error (HTTP ${response.status}): ${message}`
        : `Piston server error: HTTP ${response.status}`,
      timedOut: false,
      exitCode: 1,
      isCompileError: false,
    };
  }

  if (!data) {
    const localResult = await runLocalFallback(language, code, stdin);
    if (localResult) return localResult;

    return {
      output: "",
      error: "No matching runtime is installed in Piston. Run: bash install-runtimes.sh",
      timedOut: false,
      exitCode: 1,
      isCompileError: false,
    };
  }

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
