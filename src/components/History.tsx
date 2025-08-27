import React from "react";
import Prism from "prismjs";
import { type HistoryItem } from "../types";
import "prismjs/components/prism-sql";
import "../styles/prism-okaidia.css";

interface HistoryProps {
  history: HistoryItem[];
}

const typeToClass: Record<HistoryItem["type"], string> = {
  welcome: "welcome",
  command: "",
  output: "output",
  error: "error",
};

const parseLineByBoundaries = (
  line: string,
  boundaries: { start: number; end: number }[]
) => {
  return boundaries.map(({ start, end }) => line.substring(start, end).trim());
};

export const History: React.FC<HistoryProps> = ({ history }) => {
  return (
    <div>
      {history.map((item, index) => (
        <div key={index} className={typeToClass[item.type]}>
          {(() => {
            if (item.type === "command") {
              return (
                <div className="flex">
                  <span className="prompt">{item.prompt || "SQL> "}&nbsp;</span>
                  <pre className="!bg-transparent !p-0 m-0 w-full">
                    <code
                      dangerouslySetInnerHTML={{
                        __html: Prism.highlight(
                          item.text,
                          Prism.languages.sql,
                          "sql"
                        ),
                      }}
                    />
                  </pre>
                </div>
              );
            }

            if (item.type === "output") {
              const lines = item.text.trim().split("\n");
              const isTable = lines.length >= 2 && /^[-\s]+$/.test(lines[1]);

              if (isTable) {
                const headerLine = lines[0];
                const separatorLine = lines[1];
                const boundaries: { start: number; end: number }[] = [];

                const dashRegex = /(-+)/g;
                let match;
                while ((match = dashRegex.exec(separatorLine)) !== null) {
                  boundaries.push({
                    start: match.index,
                    end: match.index + match[0].length,
                  });
                }

                if (boundaries.length === 0) {
                  return item.text
                    .split("\n")
                    .map((line, i) => <div key={i}>{line}</div>);
                }

                const headers = parseLineByBoundaries(headerLine, boundaries);
                const dataRows = [];
                let footer = null;

                for (let i = 2; i < lines.length; i++) {
                  const line = lines[i];
                  if (line.trim().match(/\d+\s+row\(s\)\s+selected\./)) {
                    footer = line.trim();
                  } else if (line.trim()) {
                    // Ensure the line is not just whitespace
                    dataRows.push(parseLineByBoundaries(line, boundaries));
                  }
                }

                return (
                  <>
                    <table className="border-collapse my-2 font-mono whitespace-nowrap text-sm">
                      <thead>
                        <tr>
                          {headers.map((h, i) => (
                            <th
                              key={i}
                              className="border border-slate-600 py-2 px-3 text-left font-medium text-cyan-300"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dataRows.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className="border border-slate-600 py-2 px-3 text-left"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {footer && <div className="mt-1.5 font-mono">{footer}</div>}
                  </>
                );
              }
            }

            return item.text
              .split("\n")
              .map((line, i) => <div key={i}>{line}</div>);
          })()}
        </div>
      ))}
    </div>
  );
};
