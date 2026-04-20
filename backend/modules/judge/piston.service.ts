import axios from "axios";

const PISTON_URL = process.env.PISTON_URL || "http://localhost:2000/api/v2/execute";

const LANGUAGE_MAP: any = {
  cpp: { language: "cpp", version: "10.2.0" }, // ✅ FIXED
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

  const response = await axios.post(PISTON_URL, {
    language: langConfig.language,
    version: langConfig.version,
    files: [
      {
        name: language === "java" ? "Main.java" : "main",
        content: code,
      },
    ],
    stdin,
  });

  return response.data.run;
}

export const SUPPORTED_LANGUAGES = LANGUAGE_MAP;