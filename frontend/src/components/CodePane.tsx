import { useEffect, useState } from "react";
import api from "../lib/api";

const DEFAULT_CODE: Record<string, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello World";
    return 0;
}`,
  python: `print("Hello World")`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`,
};

export default function CodePane({
  videoId,
  problemTitle,
  problemDescription,
}: {
  videoId: number;
  problemTitle: string;
  problemDescription: string;
}) {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE["cpp"]);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [stdin, setStdin] = useState("");

  useEffect(() => {
    setCode(DEFAULT_CODE[language]);
  }, [videoId, language]);

  const handleRun = async () => {
    if (running || code.trim().length === 0) return;

    try {
      setRunning(true);
      setOutput("Running...");

      const res = await api.post("/run", {
        code,
        language,
        videoId,
        sampleOnly: true,
        stdin,
      });

      setOutput(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      setOutput(err?.response?.data?.error || "Execution failed");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (running || code.trim().length === 0) return;

    try {
      setRunning(true);
      setOutput("Submitting...");

      const res = await api.post("/submit", {
        code,
        language,
        videoId,
      });

      setOutput(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      setOutput(err?.response?.data?.error || "Submission failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <h3>{problemTitle}</h3>
      <p>{problemDescription}</p>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="cpp">C++</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
      </select>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={12}
      />

      {/* ✅ Custom input */}
      <textarea
        placeholder="Custom Input"
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        rows={4}
      />

      <div>
        <button onClick={handleRun} disabled={running}>
          Run
        </button>
        <button onClick={handleSubmit} disabled={running}>
          Submit
        </button>
      </div>

      <pre>{output}</pre>
    </div>
  );
}