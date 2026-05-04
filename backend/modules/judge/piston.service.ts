import axios from "axios";

const PISTON_URL = process.env.PISTON_URL || "http://localhost:2000/api/v2/execute";

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  // Piston exposes GCC for C++ execution.
  cpp: { language: "gcc", version: "10.2.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
};

export async function runCode(
  language: string,
  code: string,
  stdin: string
) {
  const langConfig = LANGUAGE_MAP[language];

  if (!langConfig) {
    throw new Error("Unsupported language");
  }

  try {
    const response = await axios.post(
      PISTON_URL,
      {
        language: langConfig.language,
        version: langConfig.version,
        files: [
          {
            name: language === "java" ? "Main.java" : "main",
            content: code,
          },
        ],
        stdin,
      },
      { timeout: 15000 }
    );

    return response.data.run;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const pistonMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;
      throw new Error(`Code engine request failed: ${pistonMessage}`);
    }
    throw error;
  }
}

export const SUPPORTED_LANGUAGES = LANGUAGE_MAP;