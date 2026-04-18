import { runCode } from "./piston.service.js";

export interface TestCase {
  input: string;
  output: string;
  isHidden?: boolean;
}

export type Verdict =
  | "Accepted"
  | "Wrong Answer"
  | "Runtime Error"
  | "Time Limit Exceeded"
  | "Compile Error";

export interface JudgeResult {
  status: Verdict;
  passedCount: number;
  totalCount: number;
  error?: string;
  executionTimeMs?: number;
  failedCase?: {
    input: string;
    expected: string;
    got: string;
    isHidden: boolean;
  };
}

const CONCURRENCY = 8; // run up to 8 Piston jobs in parallel

// Run test cases in parallel batches of CONCURRENCY.
// This brings 1000 sequential calls (~5+ min) down to ~ceiling(1000/8) batches x latency ~ seconds.
export async function judgeSubmission(
  testcases: TestCase[],
  code: string,
  language: string,
  sampleOnly = false
): Promise<JudgeResult> {
  const cases = sampleOnly ? testcases.filter((tc) => !tc.isHidden) : testcases;
  const total = cases.length;
  const start = Date.now();
  let passed = 0;

  // Process in batches so we don't open thousands of connections at once
  for (let batchStart = 0; batchStart < total; batchStart += CONCURRENCY) {
    const batch = cases.slice(batchStart, batchStart + CONCURRENCY);

    // Fire all cases in this batch simultaneously
    const results = await Promise.all(
      batch.map((tc) => runCode(language, code, tc.input))
    );

    // Check results in order -- stop at first failure
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const tc = batch[i];

      if (result.timedOut) {
        return {
          status: "Time Limit Exceeded",
          passedCount: passed,
          totalCount: total,
          error: "Your code exceeded the 5-second time limit.",
          executionTimeMs: Date.now() - start,
        };
      }

      // piston.service.ts already catches compile errors in the Piston compile phase
      // and surfaces them via exitCode !== 0 + isCompileError flag.
      // We trust that flag rather than re-parsing stderr with fragile string matching.
      if (result.exitCode !== 0) {
        return {
          status: result.isCompileError ? "Compile Error" : "Runtime Error",
          passedCount: passed,
          totalCount: total,
          error: result.error.trim() || "Non-zero exit code with no stderr output.",
          executionTimeMs: Date.now() - start,
        };
      }

      if (result.output.trim() !== tc.output.trim()) {
        return {
          status: "Wrong Answer",
          passedCount: passed,
          totalCount: total,
          failedCase: tc.isHidden
            ? { input: "hidden", expected: "hidden", got: result.output.trim(), isHidden: true }
            : { input: tc.input, expected: tc.output.trim(), got: result.output.trim(), isHidden: false },
          executionTimeMs: Date.now() - start,
        };
      }

      passed++;
    }
  }

  return {
    status: "Accepted",
    passedCount: passed,
    totalCount: total,
    executionTimeMs: Date.now() - start,
  };
}
