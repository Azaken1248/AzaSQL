import React, { useState, useEffect, useRef, useMemo } from "react";
import { Terminal } from "./Terminal";
import { useSqlEngine } from "../hooks/useSqlEngine";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faCloudArrowUp,
  faDownload,
  faUpload,
  faTableList,
  faTerminal,
  faHistory,
  faSpinner,
  faCheckCircle,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  authenticate,
  saveDbToFirestore,
  loadDbFromFirestore,
} from "../services/firebase";
import { type HistoryItem } from "../types";
import { SchemaViewer } from "./SchemaViewer";
import { HistoryPanel } from "./HistoryPanel";
import "../styles/terminal.css";
import "../styles/scrollbar.css";
import "../styles/prism-okaidia.css";

const WELCOME_MESSAGE: HistoryItem = {
  type: "welcome",
  text: `SQL*Plus Web Simulator (v2.0)\nYour database is automatically saved to the cloud.\nType 'help' or 'clear'. End SQL with a semicolon (;) or '/' to execute.`,
};

const HELP_MESSAGE = `Simulated SQL*Plus Commands:
  /                      - Executes the command in the buffer.
  DESC <table_name>      - Shows the structure of a table.
  SET LINESIZE <number>  - Sets the width for displaying output.
  CLEAR                  - Clears the terminal screen.
  HELP                   - Shows this help message.`;

const DEFAULT_DB_SQL = `
CREATE TABLE employees (
    employee_id INT PRIMARY KEY, first_name VARCHAR(20), last_name VARCHAR(25),
    email VARCHAR(25), hire_date DATE, job_id VARCHAR(10), salary DECIMAL(8, 2)
);
INSERT INTO employees VALUES
(100, 'Steven', 'King', 'SKING', '2003-06-17', 'AD_PRES', 24000.00),
(101, 'Neena', 'Kochhar', 'NKOCHHAR', '2005-09-21', 'AD_VP', 17000.00);
CREATE TABLE jobs (job_id VARCHAR(10) PRIMARY KEY, job_title VARCHAR(35));
INSERT INTO jobs VALUES ('AD_PRES', 'President'), ('AD_VP', 'Administration VP');
`;

type ActiveTab = "schema" | "terminal" | "history";

const SQLPlusSimulator: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([WELCOME_MESSAGE]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("Initializing...");
  const [isInputDisabled, setIsInputDisabled] = useState(true);
  const [commandBuffer, setCommandBuffer] = useState<string[]>([]);
  const [settings, setSettings] = useState({ linesize: 1000 });
  const [tables, setTables] = useState<string[]>([]);
  const [prefilledCommand, setPrefilledCommand] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("terminal");

  const { isReady, loadDb, executeSql, exportDb, getTables, getTableInfo } =
    useSqlEngine();
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: { name: string; key: ActiveTab; icon: any }[] = [
    { name: "Schema", key: "schema", icon: faTableList },
    { name: "Terminal", key: "terminal", icon: faTerminal },
    { name: "History", key: "history", icon: faHistory },
  ];

  const statusDisplay = useMemo(() => {
    const lowerStatus = status.toLowerCase();

    let icon = faSpinner;
    let colorClass = "text-yellow-400";
    let spin = true;

    if (lowerStatus.includes("fail") || lowerStatus.includes("error")) {
      icon = faExclamationCircle;
      colorClass = "text-red-400";
      spin = false;
    } else if (
      !lowerStatus.endsWith("...") &&
      (lowerStatus.includes("ready") ||
        lowerStatus.includes("saved") ||
        lowerStatus.includes("loaded") ||
        lowerStatus.includes("downloaded") ||
        lowerStatus.includes("imported") ||
        lowerStatus.includes("succeeded") ||
        lowerStatus.includes("restored"))
    ) {
      icon = faCheckCircle;
      colorClass = "text-green-400";
      spin = false;
    }

    return (
      <div className="flex items-center gap-2">
        <FontAwesomeIcon
          icon={icon}
          className={`${colorClass} ${spin ? "fa-spin" : ""}`}
          fixedWidth
        />
        <span>{status}</span>
      </div>
    );
  }, [status]);

  useEffect(() => {
    if (isReady) {
      setTables(getTables());
    }
  }, [isReady, getTables, history]);

  useEffect(() => {
    const initApp = async () => {
      if (!isReady) return;

      setStatus("Authenticating...");
      const userId = await authenticate();
      if (!userId) {
        setStatus("Authentication failed. Using local session.");
        setIsInputDisabled(false);
        return;
      }

      setStatus("Loading saved database...");
      const savedDbData = await loadDbFromFirestore();
      if (savedDbData) {
        loadDb(savedDbData);
        setHistory([
          WELCOME_MESSAGE,
          { type: "output", text: "Session restored from the cloud." },
        ]);
        setStatus("Database loaded. Ready.");
      } else {
        setStatus("Creating new database...");
        executeSql(DEFAULT_DB_SQL, settings);
        setHistory([
          WELCOME_MESSAGE,
          { type: "output", text: "Created default tables (employees, jobs)." },
        ]);
        const dbData = exportDb();
        if (dbData) await saveDbToFirestore(dbData);
        setStatus("New session saved. Ready.");
      }
      setIsInputDisabled(false);
    };
    initApp();
  }, [isReady]);

  const handleForceSave = async () => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setStatus("Force saving to cloud...");
    const dbData = exportDb();
    if (dbData) {
      const success = await saveDbToFirestore(dbData);
      setStatus(success ? "Session saved to cloud." : "Cloud save failed.");
      setHistory((prev) => [
        ...prev,
        {
          type: "output",
          text: `> Force save to cloud ${success ? "succeeded" : "failed"}.`,
        },
      ]);
    }
  };

  const handleDownloadSession = () => {
    setStatus("Exporting database...");
    const dbData = exportDb();
    if (dbData) {
      const blob = new Blob([new Uint8Array(dbData)]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "websql_session.db";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus("Session downloaded.");
      setHistory((prev) => [
        ...prev,
        { type: "output", text: "> Session downloaded as websql_session.db." },
      ]);
    } else {
      setStatus("Export failed.");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setStatus("Importing session...");
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dbData = new Uint8Array(e.target?.result as ArrayBuffer);
          loadDb(dbData);
          setHistory([
            WELCOME_MESSAGE,
            {
              type: "output",
              text: `> Session restored from file: ${file.name}`,
            },
          ]);
          setStatus("Session imported successfully.");
          setActiveTab("terminal");
        } catch (error) {
          console.error("File load error:", error);
          setStatus("Failed to load session file.");
          setHistory((prev) => [
            ...prev,
            {
              type: "error",
              text: "> Failed to load session file. Is it a valid .db file?",
            },
          ]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    event.target.value = "";
  };

  const debouncedSave = () => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setStatus("Saving...");
      const dbData = exportDb();
      if (dbData) {
        const success = await saveDbToFirestore(dbData);
        setStatus(success ? "All changes saved." : "Save failed.");
      }
    }, 1000);
  };

  const processAndExecute = (buffer: string[]) => {
    const fullCommand = buffer.join(" ").trim();
    if (!fullCommand) {
      setCommandBuffer([]);
      return;
    }
    const commandLower = fullCommand.toLowerCase();
    const result = executeSql(fullCommand, settings);
    if (result.error) {
      setHistory((prev) => [
        ...prev,
        { type: "error", text: result.error ?? "An unknown error occurred." },
      ]);
    } else if (result.message) {
      setHistory((prev) => [
        ...prev,
        { type: "output", text: result.message! },
      ]);
      const modifyingCommands = [
        "insert",
        "update",
        "delete",
        "create",
        "drop",
        "alter",
      ];
      if (modifyingCommands.some((cmd) => commandLower.startsWith(cmd))) {
        debouncedSave();
      }
    }
    setCommandBuffer([]);
  };

  const handleCommandSubmit = async (command: string) => {
    setPrefilledCommand("");
    const trimmedCommand = command.trim();
    const promptForHistory =
      commandBuffer.length === 0 ? "SQL>" : `${commandBuffer.length + 1}>`;
    setHistory((prev) => [
      ...prev,
      { type: "command", text: command, prompt: promptForHistory },
    ]);
    if (!trimmedCommand) return;

    setCommandHistory((prev) => [...prev, trimmedCommand]);
    const commandLower = trimmedCommand.toLowerCase();

    if (commandLower === "clear") {
      setHistory([]);
      setCommandBuffer([]);
      return;
    }
    if (commandLower === "help") {
      setHistory((prev) => [...prev, { type: "output", text: HELP_MESSAGE }]);
      return;
    }
    if (commandLower === "/") {
      processAndExecute(commandBuffer);
      return;
    }
    const describeMatch = commandLower.match(
      /^(desc|describe)\s+([a-zA-Z0-9_]+)/
    );
    if (describeMatch) {
      const tableName = describeMatch[2];
      const result = executeSql(`PRAGMA table_info(${tableName});`, settings);
      if (result.error) {
        setHistory((prev) => [
          ...prev,
          { type: "error", text: result.error ?? "An unknown error occurred." },
        ]);
      } else if (result.message) {
        setHistory((prev) => [
          ...prev,
          { type: "output", text: result.message! },
        ]);
      }
      return;
    }
    const setLinesizeMatch = commandLower.match(/^set\s+linesize\s+(\d+)/);
    if (setLinesizeMatch) {
      const newSize = parseInt(setLinesizeMatch[1], 10);
      setSettings({ ...settings, linesize: newSize });
      setHistory((prev) => [
        ...prev,
        { type: "output", text: `LINESIZE set to ${newSize}` },
      ]);
      return;
    }

    const endsWithSemicolon = trimmedCommand.endsWith(";");
    const commandToBuffer = endsWithSemicolon
      ? trimmedCommand.slice(0, -1)
      : trimmedCommand;

    if (commandBuffer.length === 0 && endsWithSemicolon) {
      processAndExecute([commandToBuffer]);
    } else {
      const currentBuffer = [...commandBuffer, commandToBuffer];
      if (endsWithSemicolon) {
        processAndExecute(currentBuffer);
      } else {
        setCommandBuffer(currentBuffer);
      }
    }
  };

  const onPrefill = (command: string) => {
    setPrefilledCommand(command);
    setActiveTab("terminal");
  };

  return (
    <div
      id="simulator-container"
      className="flex h-full w-full max-w-7xl flex-col"
    >
      <header className="mb-4 flex flex-shrink-0 items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-200">
            <FontAwesomeIcon icon={faDatabase} className="mr-3" />
            WebSQL
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleForceSave}
            title="Force save to cloud"
            className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <FontAwesomeIcon icon={faCloudArrowUp} className="mr-2" />
            Save
          </button>
          <button
            onClick={handleDownloadSession}
            title="Download session as .db file"
            className="rounded bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-500"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            Download
          </button>
          <button
            onClick={handleUploadClick}
            title="Upload session from .db file"
            className="rounded bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-500"
          >
            <FontAwesomeIcon icon={faUpload} className="mr-2" />
            Upload
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".db"
          />
        </div>
      </header>

      <div className="mb-2 border-b border-gray-700 md:hidden">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${
                activeTab === tab.key
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300"
              } flex items-center whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium`}
            >
              <FontAwesomeIcon icon={tab.icon} className="mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex min-h-0 flex-grow flex-col gap-4 md:flex-row">
        <div
          className={`${
            activeTab === "schema" ? "flex" : "hidden"
          } w-full flex-col overflow-y-auto overflow-x-hidden md:flex md:w-64 md:flex-shrink-0`}
        >
          <SchemaViewer
            tables={tables}
            onTableSelect={(table) => onPrefill(`SELECT * FROM ${table};`)}
            getTableInfo={getTableInfo}
          />
        </div>

        <main
          className={`${
            activeTab === "terminal" ? "flex" : "hidden"
          } min-h-0 w-full flex-grow flex-col md:flex`}
        >
          <Terminal
            history={history}
            status={statusDisplay}
            isDisabled={isInputDisabled}
            onCommandSubmit={handleCommandSubmit}
            commandHistory={commandHistory}
            continuationLine={commandBuffer.length + 1}
            prefilledCommand={prefilledCommand}
          />
        </main>

        <div
          className={`${
            activeTab === "history" ? "flex" : "hidden"
          } w-full flex-col overflow-y-auto overflow-x-hidden lg:flex lg:w-64 lg:flex-shrink-0`}
        >
          <HistoryPanel history={commandHistory} onHistorySelect={onPrefill} />
        </div>
      </div>
    </div>
  );
};

export default SQLPlusSimulator;
