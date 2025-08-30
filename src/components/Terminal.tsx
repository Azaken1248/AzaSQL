import React, { useRef, useEffect } from "react";
import { History } from "./History";
import { InputLine } from "./InputLine";
import { type HistoryItem } from "../types";
import "../styles/terminal.css";

interface TerminalProps {
  history: HistoryItem[];
  status: React.ReactNode;
  isDisabled: boolean;
  onCommandSubmit: (command: string) => void;
  commandHistory: string[];
  continuationLine: number;
  prefilledCommand: string;
  code: string;
  suggestion: string;
  onCodeChange: (newCode: string) => void;
  setSuggestion: (suggestion: string) => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  history,
  status,
  isDisabled,
  onCommandSubmit,
  commandHistory,
  continuationLine,
  prefilledCommand,
  code,
  suggestion,
  onCodeChange,
  setSuggestion,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <>
      <div
        id="terminal"
        ref={terminalRef}
        className="overflow-y-auto p-4 rounded-lg border border-gray-700 flex-grow"
      >
        <History history={history} />
        <InputLine
          isDisabled={isDisabled}
          onSubmit={onCommandSubmit}
          commandHistory={commandHistory}
          continuationLine={continuationLine}
          prefilledCommand={prefilledCommand}
          code={code}
          suggestion={suggestion}
          onCodeChange={onCodeChange}
          setSuggestion={setSuggestion}
        />
      </div>
      <div className="text-xs text-gray-400 text-right p-1">{status}</div>
    </>
  );
};
