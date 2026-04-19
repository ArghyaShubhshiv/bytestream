import { useState, useEffect, useCallback } from 'react'
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

const MONACO_LANG: Record<Language, string> = {
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

type Mode = 'run' | 'submit'

interface SubmissionResult {
  status: string
  mode?: Mode
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

interface HistoryItem {
  id: number
  status: string
  language: string
  passedCount: number
  totalCount: number
  executionTimeMs: number | null
  createdAt: string
}

const STATUS_COLOR: Record<string, string> = {
  'Accepted':            'text-green-400',
  'Wrong Answer':        'text-yellow-400',
  'Time Limit Exceeded': 'text-orange-400',
  'Runtime Error':       'text-red-400',
  'Compile Error':       'text-red-400',
  'Error':               'text-red-400',
}

const STATUS_ICON: Record<string, string> = {
  'Accepted':            '✓',
  'Wrong Answer':        '✗',
  'Time Limit Exceeded': '⏱',
  'Runtime Error':       '!',
  'Compile Error':       '!',
  'Error':               '!',
}

export default function CodePane({ problemTitle, problemDescription, videoId, testCaseCount = 0 }: CodePaneProps) {
  const [language, setLanguage]     = useState<Language>('python')
  const [code, setCode]             = useState<string>(DEFAULT_CODE.python)
  const [result, setResult]         = useState<SubmissionResult | null>(null)
  const [running, setRunning]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab]               = useState<'problem' | 'history'>('problem')
  const [history, setHistory]       = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await api.get(`/submissions?videoId=${videoId}`)
      setHistory(Array.isArray(res.data) ? res.data : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    if (tab === 'history') fetchHistory()
  }, [tab, fetchHistory])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCode(DEFAULT_CODE[lang])
    setResult(null)
  }

  const execute = async (mode: Mode) => {
    const endpoint = mode === 'run' ? '/run' : '/submit'
    if (mode === 'run') setRunning(true)
    else setSubmitting(true)
    setResult(null)
    try {
      const res = await api.post(endpoint, {
        code,
        language: LANGUAGE_KEY[language],
        videoId,
      })
      setResult(res.data)
      if (mode === 'submit' && res.data.status === 'Accepted') {
        // Refresh history after a successful submit
        fetchHistory()
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Request failed. Is the server running?'
      setResult({ status: 'Error', error: msg })
    } finally {
      setRunning(false)
      setSubmitting(false)
    }
  }

  const isLoading = running || submitting
  const statusColor = (s: string) => STATUS_COLOR[s] ?? 'text-red-400'
  const statusIcon  = (s: string) => STATUS_ICON[s]  ?? '!'

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4]">

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-4 pt-3 shrink-0 border-b border-[#333]">
        {(['problem', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-[#0e639c] text-white'
                : 'border-transparent text-[#a0a0a0] hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Problem tab */}
      {tab === 'problem' && (
        <div className="p-5 border-b border-[#333] shrink-0">
          <h2 className="m-0 mb-2 text-white text-xl font-bold">{problemTitle}</h2>
          <p className="m-0 leading-relaxed text-sm text-[#a0a0a0]">{problemDescription}</p>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="p-4 border-b border-[#333] shrink-0 max-h-48 overflow-y-auto">
          {historyLoading && <p className="text-xs text-[#888]">Loading…</p>}
          {!historyLoading && history.length === 0 && (
            <p className="text-xs text-[#888]">No submissions yet. Sign in and submit to see history.</p>
          )}
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-[#333] last:border-0 text-xs">
              <span className={`font-medium ${statusColor(h.status)}`}>{h.status}</span>
              <span className="text-[#888]">{h.language}</span>
              <span className="text-[#888]">{h.passedCount}/{h.totalCount} cases</span>
              {h.executionTimeMs != null && <span className="text-[#888]">{h.executionTimeMs}ms</span>}
              <span className="text-[#555]">{new Date(h.createdAt).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Language selector */}
      <div className="px-4 pt-3 pb-0 flex items-center gap-2 shrink-0">
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
        {language === 'java' && (
          <span className="ml-auto text-[10px] text-yellow-500 opacity-75">
            class must be named Main
          </span>
        )}
      </div>
      {testCaseCount === 0 && (
        <div className="px-4 py-3 border-b border-[#333] bg-[#1e1e1e] text-sm text-yellow-200">
          This problem does not have test cases yet. Running or submitting code may fail until the creator adds test cases.
        </div>
      )}

      {/* Monaco Editor */}
      <div className="grow pt-2">
        <Editor
          height="100%"
          language={MONACO_LANG[language]}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 12 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      {/* Loading bar */}
      {isLoading && (
        <div className="h-0.5 bg-[#333] shrink-0 overflow-hidden">
          <div className="h-full bg-[#0e639c] animate-pulse w-full" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      )}

      {/* Result panel */}
      {result && !isLoading && (
        <div className="px-4 py-3 border-t border-[#333] bg-[#252526] shrink-0 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <p className={`text-sm font-bold ${statusColor(result.status)}`}>
              {statusIcon(result.status)} {result.status}
              {result.mode && (
                <span className="ml-2 text-xs font-normal text-[#888]">
                  ({result.mode === 'run' ? 'sample cases' : 'all cases'})
                </span>
              )}
            </p>
            <div className="flex items-center gap-3 text-xs text-[#888]">
              {result.passedCount !== undefined && result.totalCount !== undefined && (
                <span>{result.passedCount}/{result.totalCount} passed</span>
              )}
              {result.executionTimeMs !== undefined && (
                <span>{result.executionTimeMs}ms</span>
              )}
            </div>
          </div>

          {result.error && (
            <pre className="mt-1 text-xs text-red-300 whitespace-pre-wrap font-mono bg-[#1e1e1e] p-2 rounded">
              {result.error}
            </pre>
          )}

          {result.failedCase && (
            <div className="mt-2 text-xs space-y-1 font-mono bg-[#1e1e1e] p-2 rounded">
              {result.failedCase.isHidden ? (
                <p className="text-[#888]">Failed on a hidden test case.</p>
              ) : (
                <>
                  <p><span className="text-[#888]">Input:    </span><span className="text-[#d4d4d4]">{result.failedCase.input}</span></p>
                  <p><span className="text-[#888]">Expected: </span><span className="text-green-300">{result.failedCase.expected}</span></p>
                  <p><span className="text-[#888]">Got:      </span><span className="text-red-300">{result.failedCase.got}</span></p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="p-4 border-t border-[#333] flex justify-end gap-3 bg-[#252526] shrink-0">
        <button
          onClick={() => execute('run')}
          disabled={isLoading || testCaseCount === 0}
          className="px-5 py-2 bg-[#2d2d2d] hover:bg-[#3e3e3e] border border-[#555] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-medium rounded cursor-pointer text-sm"
        >
          {running ? 'Running…' : 'Run'}
        </button>
        <button
          onClick={() => execute('submit')}
          disabled={isLoading || testCaseCount === 0}
          className="px-6 py-2 bg-[#2ea043] hover:bg-[#2c974b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-bold rounded cursor-pointer text-sm"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </div>
  )
}
