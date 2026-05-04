import { runCode } from "./piston.service";

export interface TestCase {
  input: string;
  output?: string;
  expectedOutput?: string;
}

export async function judgeSubmission(
  testCases: any[],
  code: string,
  language: string,
  sampleOnly: boolean,
  customStdin?: string
) {
  let passedCount = 0;
  
  // Custom Input run (only when sampleOnly is true)
  if (customStdin !== undefined && sampleOnly) {
    const result = await runCode(language, code, customStdin);

    if (result.signal) {
      return {
        status: result.signal === "SIGKILL" ? "Time Limit Exceeded" : "Runtime Error",
        passedCount: 0,
        totalCount: 1,
        error: `Process terminated: ${result.signal}`,
      };
    }

    const isCompileError = language !== "python" && result.code !== 0 && result.stderr && !result.stdout;
    if (isCompileError) {
      return { status: "Compile Error", passedCount: 0, totalCount: 1, error: result.stderr };
    }
    if (result.code !== 0) {
      return { status: "Runtime Error", passedCount: 0, totalCount: 1, error: result.stderr };
    }

    return { status: "Accepted", passedCount: 1, totalCount: 1, actual: result.stdout || "" };
  }

  const totalCount = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    if (sampleOnly && i >= 1) break;

    const result = await runCode(language, code, tc.input);

    // ✅ SIGNAL HANDLING
    if (result.signal) {
      return {
        status:
          result.signal === "SIGKILL"
            ? "Time Limit Exceeded"
            : "Runtime Error",
        passedCount,
        totalCount,
        error: `Process terminated: ${result.signal}`,
      };
    }

    // ✅ COMPILE ERROR FIX
    const isCompileError =
      i === 0 &&
      language !== "python" && 
      result.code !== 0 &&
      result.stderr &&
      !result.stdout;

    if (isCompileError) {
      return {
        status: "Compile Error",
        passedCount,
        totalCount,
        error: result.stderr,
      };
    }

    if (result.code !== 0) {
      return {
        status: "Runtime Error",
        passedCount,
        totalCount,
        error: result.stderr,
      };
    }

    const expected = (tc.output ?? tc.expectedOutput ?? "").trim();
    const actual = (result.stdout || "").trim();

    if (expected !== actual) {
      return {
        status: "Wrong Answer",
        passedCount,
        totalCount,
        input: tc.input,
        expected,
        actual,
      };
    }

    passedCount++;
  }

  return {
    status: "Accepted",
    passedCount,
    totalCount,
  };
}
