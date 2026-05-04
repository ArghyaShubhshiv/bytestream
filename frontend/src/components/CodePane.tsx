import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";

type Language = "cpp" | "python" | "java";

const DEFAULT_CODE: Record<Language, string> = {
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

const MONACO_LANGUAGE: Record<Language, string> = {
  cpp: "cpp",
  python: "python",
  java: "java",
};

const LANGUAGE_LABEL: Record<Language, string> = {
  cpp: "C++",
  python: "Python",
  java: "Java",
};

const MARKER_OWNER = "judge-diagnostics";

type JudgeResponse = {
  status?: string;
  error?: string;
  actual?: string;
  expected?: string;
  input?: string;
  passedCount?: number;
  totalCount?: number;
};

export default function CodePane({
  videoId,
  problemTitle,
  problemDescription,
}: {
  videoId: number;
  problemTitle: string;
  problemDescription: string;
  testCaseCount?: number;
}) {
  const [language, setLanguage] = useState<Language>("cpp");
  const [codeByLanguage, setCodeByLanguage] = useState<Record<Language, string>>(
    DEFAULT_CODE
  );
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [stdin, setStdin] = useState("");
  const monacoRef = useRef<any>(null);
  const modelRef = useRef<any>(null);

  const clearMarkers = () => {
    if (!monacoRef.current || !modelRef.current) return;
    monacoRef.current.editor.setModelMarkers(modelRef.current, MARKER_OWNER, []);
  };

  useEffect(() => {
    setCodeByLanguage(DEFAULT_CODE);
    setOutput("");
    setStdin("");
    clearMarkers();
  }, [videoId]);

  const code = codeByLanguage[language];

  const outputText = useMemo(() => {
    if (!output) return "Output will appear here...";
    return output;
  }, [output]);

  const setMarkersFromError = (lang: Language, errorText?: string) => {
    if (!monacoRef.current || !modelRef.current) return;
    if (!errorText) {
      clearMarkers();
      return;
    }

    const markers: any[] = [];

    if (lang === "cpp") {
      const regex = /:(\d+):(\d+):\s*(?:fatal )?error:\s*(.*)/g;
      let match: RegExpExecArray | null = regex.exec(errorText);
      while (match) {
        const line = Number(match[1]);
        const col = Number(match[2]);
        markers.push({
          severity: monacoRef.current.MarkerSeverity.Error,
          message: match[3] || "Compile error",
          startLineNumber: line,
          startColumn: Math.max(col, 1),
          endLineNumber: line,
          endColumn: Math.max(col + 1, 2),
        });
        match = regex.exec(errorText);
      }
    } else if (lang === "java") {
      const regex = /Main\.java(?:\.java)?:(\d+):\s*error:\s*(.*)/g;
      let match: RegExpExecArray | null = regex.exec(errorText);
      while (match) {
        const line = Number(match[1]);
        markers.push({
          severity: monacoRef.current.MarkerSeverity.Error,
          message: match[2] || "Compile error",
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: 999,
        });
        match = regex.exec(errorText);
      }
    } else if (lang === "python") {
      const lineRegex = /File "main", line (\d+)/g;
      const pyErrorLine =
        errorText
          .trim()
          .split("\n")
          .filter(Boolean)
          .slice(-1)[0] || "Runtime error";
      let match: RegExpExecArray | null = lineRegex.exec(errorText);
      while (match) {
        const line = Number(match[1]);
        markers.push({
          severity: monacoRef.current.MarkerSeverity.Error,
          message: pyErrorLine,
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: 999,
        });
        match = lineRegex.exec(errorText);
      }
    }

    monacoRef.current.editor.setModelMarkers(modelRef.current, MARKER_OWNER, markers);
  };

  const parseRunOutput = (data: JudgeResponse) => {
    const status = data.status || "Unknown";
    const lines: string[] = [status];

    if (typeof data.passedCount === "number" && typeof data.totalCount === "number") {
      lines.push(`Passed: ${data.passedCount}/${data.totalCount}`);
    }
    if (data.input) lines.push(`Input:\n${data.input}`);
    if (data.expected) lines.push(`Expected:\n${data.expected}`);
    if (data.actual) lines.push(`Actual:\n${data.actual}`);
    if (data.error) lines.push(`Error:\n${data.error}`);

    return lines.join("\n\n");
  };

  const handleRun = async () => {
    if (running || code.trim().length === 0) return;

    try {
      setRunning(true);
      setOutput("Running...");
      clearMarkers();

      const res = await api.post("/run", {
        code,
        language,
        videoId,
        sampleOnly: true,
        stdin,
      });

      setOutput(parseRunOutput(res.data));
      setMarkersFromError(language, res.data?.error);
    } catch (err: any) {
      const errorText = err?.response?.data?.error || "Execution failed";
      setOutput(errorText);
      setMarkersFromError(language, errorText);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (running || code.trim().length === 0) return;

    try {
      setRunning(true);
      setOutput("Submitting...");
      clearMarkers();

      const res = await api.post("/submit", {
        code,
        language,
        videoId,
      });

      setOutput(parseRunOutput(res.data));
      setMarkersFromError(language, res.data?.error);
    } catch (err: any) {
      const errorText = err?.response?.data?.error || "Submission failed";
      setOutput(errorText);
      setMarkersFromError(language, errorText);
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
        onChange={(e) => {
          setLanguage(e.target.value as Language);
          clearMarkers();
        }}
      >
        <option value="cpp">{LANGUAGE_LABEL.cpp}</option>
        <option value="python">{LANGUAGE_LABEL.python}</option>
        <option value="java">{LANGUAGE_LABEL.java}</option>
      </select>

      <Editor
        height="380px"
        language={MONACO_LANGUAGE[language]}
        value={code}
        onMount={(editor, monaco) => {
          monacoRef.current = monaco;
          modelRef.current = editor.getModel();
        }}
        onChange={(value) =>
          setCodeByLanguage((prev) => ({ ...prev, [language]: value || "" }))
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontLigatures: true,
          automaticLayout: true,
          wordWrap: "on",
          lineNumbers: "on",
          glyphMargin: true,
          folding: true,
          bracketPairColorization: { enabled: true },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          suggestOnTriggerCharacters: true,
          parameterHints: { enabled: true },
          formatOnPaste: true,
          formatOnType: true,
        }}
      />

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

      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{outputText}</pre>
    </div>
  );
}
