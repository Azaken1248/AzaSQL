import React, { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-sql";

interface InputLineProps {
  isDisabled: boolean;
  onSubmit: (command: string) => void;
  commandHistory: string[];
  continuationLine: number;
  prefilledCommand: string;
  code: string;
  suggestion: string;
  onCodeChange: (newCode: string) => void;
  setSuggestion: (suggestion: string) => void;
}

export const InputLine: React.FC<InputLineProps> = ({
  isDisabled,
  onSubmit,
  commandHistory,
  continuationLine,
  prefilledCommand,
  code,
  suggestion,
  onCodeChange,
  setSuggestion,
}) => {
  const [historyIndex, setHistoryIndex] = useState(commandHistory.length);
  const editorRef = React.useRef<any>(null);

  useEffect(() => {
    setHistoryIndex(commandHistory.length);
  }, [commandHistory]);

  useEffect(() => {
    if (prefilledCommand) {
      onCodeChange(prefilledCommand);
      setTimeout(() => editorRef.current?._input?.focus(), 50);
    }
  }, [prefilledCommand]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const cursorPosition = editorRef.current?._input?.selectionStart;
    const isCursorAtEnd = cursorPosition === code.length;

    if (e.key === "ArrowRight" && suggestion && isCursorAtEnd) {
      e.preventDefault();
      const words = code.trim().split(" ");
      words[words.length - 1] = suggestion;
      const newCode = words.join(" ") + " ";
      onCodeChange(newCode);
      setSuggestion("");
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (code.trim()) {
        onSubmit(code);
      }
    } else if (e.key === "ArrowUp") {
      if (code.split("\n").length <= 1) {
        e.preventDefault();
        const newIndex = Math.max(0, historyIndex - 1);
        if (commandHistory[newIndex] !== undefined) {
          onCodeChange(commandHistory[newIndex]);
          setHistoryIndex(newIndex);
        }
      }
    } else if (e.key === "ArrowDown") {
      if (code.split("\n").length <= 1) {
        e.preventDefault();
        const newIndex = Math.min(commandHistory.length, historyIndex + 1);
        onCodeChange(commandHistory[newIndex] || "");
        setHistoryIndex(newIndex);
      }
    }
  };

  const prompt = continuationLine > 1 ? `${continuationLine}> ` : "SQL> ";

  const words = code.split(" ");
  const lastWord = words[words.length - 1] || "";
  const ghostText =
    suggestion && suggestion.toLowerCase().startsWith(lastWord.toLowerCase())
      ? suggestion.slice(lastWord.length)
      : "";

  const fullTextWithGhost = code + ghostText;

  return (
    <div className="flex items-start">
      <span className="prompt pt-2.5">{prompt}</span>
      <div className="editor-wrapper">
        <Editor
          ref={editorRef}
          value={code}
          onValueChange={onCodeChange}
          highlight={(code) =>
            Prism.highlight(code, Prism.languages.sql, "sql")
          }
          padding={10}
          disabled={isDisabled}
          autoFocus
          onKeyDown={handleKeyDown}
          className="editor"
        />
        {ghostText && !isDisabled && (
          <pre
            className="ghost-text"
            aria-hidden="true"
            dangerouslySetInnerHTML={{
              __html: Prism.highlight(
                fullTextWithGhost,
                Prism.languages.sql,
                "sql"
              ),
            }}
          />
        )}
      </div>
    </div>
  );
};
