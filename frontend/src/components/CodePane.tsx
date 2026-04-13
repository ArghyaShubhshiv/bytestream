import { useState } from "react";
import Editor from "@monaco-editor/react";

interface CodePaneProps {
  problemTitle: string;
  problemDescription: string;
}

export default function CodePane({ problemTitle, problemDescription }: CodePaneProps) {
  const [code, setCode] = useState<string>("// Write your algorithm here...\nfunction solve() {\n  \n}");

  const handleRunCode = () => {
    alert("Running code against test cases... (We will build this backend logic later!)");
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4]">
      
      {/* Top Section: The LeetCode Problem */}
      <div className="p-5 border-b border-[#333] shrink-0">
        <h2 className="m-0 mb-2 text-white text-2xl font-bold">{problemTitle}</h2>
        <p className="m-0 leading-relaxed text-sm">
          {problemDescription}
        </p>
      </div>

      {/* Middle Section: The VS Code Editor */}
      <div className="grow pt-3">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 },
          }}
        />
      </div>

      {/* Bottom Section: The Action Bar */}
      <div className="p-4 border-t border-[#333] flex justify-end bg-[#252526]">
        <button 
          onClick={handleRunCode}
          className="px-6 py-2 bg-[#2ea043] hover:bg-[#2c974b] transition-colors text-white font-bold rounded cursor-pointer"
        >
          Run Code
        </button>
      </div>

    </div>
  );
}