import React, { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-sql";
import "../styles/prism-okaidia.css";

interface InputLineProps {
  isDisabled: boolean;
  onSubmit: (command: string) => void;
  commandHistory: string[];
  continuationLine: number;
  prefilledCommand: string;
}

export const InputLine: React.FC<InputLineProps> = ({
  isDisabled,
  onSubmit,
  commandHistory,
  continuationLine,
  prefilledCommand,
}) => {
  const [value, setValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState(commandHistory.length);

  useEffect(() => {
    setHistoryIndex(commandHistory.length);
  }, [commandHistory]);

  useEffect(() => {
    if (prefilledCommand) {
      setValue(prefilledCommand);
    }
  }, [prefilledCommand]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(value);
      setValue("");
    } else if (e.key === "ArrowUp") {
      if (value.split("\n").length <= 1) {
        e.preventDefault();
        const newIndex = Math.max(0, historyIndex - 1);
        if (commandHistory[newIndex]) {
          setValue(commandHistory[newIndex]);
          setHistoryIndex(newIndex);
        }
      }
    } else if (e.key === "ArrowDown") {
      if (value.split("\n").length <= 1) {
        e.preventDefault();
        const newIndex = Math.min(commandHistory.length, historyIndex + 1);
        setValue(commandHistory[newIndex] || "");
        setHistoryIndex(newIndex);
      }
    }
  };

  const prompt = continuationLine > 1 ? `${continuationLine}> ` : "SQL> ";

  return (
    <div className="flex" onKeyDown={handleKeyDown}>
      <span className="prompt pt-2.5">{prompt}</span>
      <Editor
        value={value}
        onValueChange={(code) => setValue(code)}
        highlight={(code) => highlight(code, languages.sql, "sql")}
        padding={10}
        disabled={isDisabled}
        autoFocus
        className="flex-grow bg-transparent text-terminal-text font-mono focus:outline-none"
        style={{
          minHeight: "2.5em",
          fontSize: "1em",
        }}
      />
    </div>
  );
};
