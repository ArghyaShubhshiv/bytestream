import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { api } from '../../lib/api'

interface CodePaneProps {
  problemTitle: string
  problemDescription: string
  videoId: number
  testCaseCount?: number
}

type Language = 'javascript' | 'python' | 'java' | 'cpp'

const LANGUAGE_KEY: Record<Language, string> = {
  javascript: 'javascript',
  python:     'python',
  java:       'java',
  cpp:        'cpp',
}

// Starter templates — all read from stdin so they work with test cases out of the box
const DEFAULT_CODE: Record<Language, string> = {
  python:
`import sys
lines = sys.stdin.read().strip().split('\\n')
# Write your solution here
print(lines[0])`,

  javascript:
`const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
// Write your solution here
console.log(lines[0]);`,

  // Piston requires the public class to be named "Main"
  java:
`import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here — class MUST stay named "Main"
        System.out.println(sc.nextLine());
    }
}`,

  cpp:
`#include <iostream>
#include <string>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    // Write your solution here
    cout << line << endl;
    return 0;
}`,
}

interface SubmissionResult {
  status: string
  passedCount?: number
  totalCount?: number
  error?: string
  executionTimeMs?: number
  failedCase?: {
    input: string
    expected: string
    got: string
    isHidden: boolean
  }
}

type ExecutionStatus = 'Pending' | 'Passed' | 'Failed'

export default function CodePane({ problemTitle, problemDescription, videoId, testCaseCount = 0 }: CodePaneProps) {
  const [language, setLanguage] = useState<Language>('cpp')
  const [code, setCode] = useState<string>(DEFAULT_CODE.cpp)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [status, setStatus] = useState<ExecutionStatus>('Pending')
  const [running, setRunning] = useState(false)

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCode(DEFAULT_CODE[lang])
    setResult(null)
    setStatus('Pending')
  }

  useEffect(() => {
    setCode(DEFAULT_CODE[language])
    setResult(null)
    setStatus('Pending')
  }, [videoId, problemTitle, problemDescription, language])

  const execute = async () => {
    setRunning(true)
    setResult(null)
    setStatus('Pending')

    try {
      const res = await api.post<SubmissionResult>('/submit', {
        code,
        language: LANGUAGE_KEY[language],
        videoId,
      })

      setResult(res.data)
      setStatus(res.data.status === 'Accepted' ? 'Passed' : 'Failed')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Request failed. Is the server running?'
      setResult({ status: 'Error', error: msg })
      setStatus('Failed')
    } finally {
      setRunning(false)
    }
  }

  const statusTone =
    status === 'Passed'
      ? 'text-green-300 border-green-500/40 bg-green-500/10'
      : status === 'Failed'
      ? 'text-red-300 border-red-500/40 bg-red-500/10'
      : 'text-yellow-200 border-yellow-500/40 bg-yellow-500/10'

  const isLoading = running

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] text-[#d4d4d4]">
      <div className="max-h-44 overflow-y-auto border-b border-[#333] p-5 shrink-0">
        <h2 className="m-0 mb-2 text-lg font-bold text-white">{problemTitle}</h2>
        <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-[#a0a0a0]">{problemDescription}</p>
      </div>

      <div className="flex items-center gap-2 border-b border-[#333] px-4 py-3 shrink-0">
        {(Object.keys(LANGUAGE_KEY) as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              language === lang
                ? 'bg-[#0e639c] text-white'
                : 'bg-[#2d2d2d] text-[#a0a0a0] hover:bg-[#3e3e3e]'
            }`}
          >
            {lang}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#888]">Video #{videoId}</span>
      </div>

      {testCaseCount === 0 && (
        <div className="px-4 py-3 border-b border-[#333] bg-[#1e1e1e] text-sm text-yellow-200">
          This problem does not have test cases yet. Running or submitting code may fail until the creator adds test cases.
        </div>
      )}

      {/* Replaced textarea with Monaco Editor wrapped in a styled container */}
      <div className="flex-1 px-4 py-3 min-h-0">
        <div className="h-full w-full overflow-hidden rounded-xl border border-[#3a3a3a] bg-[#1e1e1e] focus-within:border-[#0e639c] focus-within:ring-1 focus-within:ring-[#0e639c] transition-shadow">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineHeight: 24,
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              fontFamily: '"Fira Code", "JetBrains Mono", monospace',
              renderLineHighlight: 'all',
              roundedSelection: true,
            }}
          />
        </div>
      </div>

      {isLoading && (
        <div className="h-0.5 bg-[#333] shrink-0 overflow-hidden">
          <div className="h-full bg-[#0e639c] animate-pulse w-full" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      )}

      <div className="border-t border-[#333] bg-[#252526] px-4 py-3 shrink-0">
        <div className={`mb-3 rounded-xl border p-3 text-sm ${statusTone}`}>
          <p className="font-semibold">Status: {running ? 'Pending' : status}</p>
          {result?.passedCount !== undefined && result?.totalCount !== undefined ? (
            <p className="mt-1 text-xs text-[#c2c2c2]">{result.passedCount}/{result.totalCount} test cases passed</p>
          ) : null}
        </div>

        {result?.error ? (
          <pre className="mb-3 rounded-lg bg-[#1e1e1e] p-3 text-xs text-red-300 whitespace-pre-wrap font-mono">
            {result.error}
          </pre>
        ) : null}

        {status === 'Failed' && result?.failedCase ? (
          <div className="mb-3 space-y-2 rounded-lg bg-[#1e1e1e] p-3 text-xs font-mono">
            {result.failedCase.isHidden ? (
              <p className="text-[#888]">Failed on a hidden test case.</p>
            ) : (
              <>
                <p><span className="text-[#8f8f8f]">Input:</span> <span className="text-[#d4d4d4]">{result.failedCase.input}</span></p>
                <p><span className="text-[#8f8f8f]">Expected Output:</span> <span className="text-green-300">{result.failedCase.expected}</span></p>
                <p><span className="text-[#8f8f8f]">Actual Output:</span> <span className="text-red-300">{result.failedCase.got}</span></p>
              </>
            )}
          </div>
        ) : null}

        <button
          onClick={execute}
          disabled={isLoading || testCaseCount === 0 || code.trim().length === 0}
          className="w-full rounded-xl bg-[#2ea043] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2c974b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run Code'}
        </button>
      </div>
    </div>
  )
}