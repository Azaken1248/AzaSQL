import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faList,
  faTable,
  faPlus,
  faPencilAlt,
  faTrash,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/scrollbar.css";

interface HistoryPanelProps {
  history: string[];
  onHistorySelect: (command: string) => void;
}

const getCommandIcon = (command: string) => {
  const commandLower = command.toLowerCase().trim();
  if (commandLower.startsWith("select")) return faList;
  if (commandLower.startsWith("create")) return faTable;
  if (commandLower.startsWith("insert")) return faPlus;
  if (commandLower.startsWith("update")) return faPencilAlt;
  if (commandLower.startsWith("delete")) return faTrash;
  return faQuestionCircle;
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onHistorySelect,
}) => {
  const reversedHistory = [...history].reverse();

  return (
    <aside className="w-full max-h-[97.3%] rounded-lg border border-gray-700 bg-zinc-800 p-4 flex flex-col">
      <h2 className="mb-2 font-bold text-gray-400 flex-shrink-0">History</h2>
      <hr className="border-gray-500" />
      <div className="overflow-y-auto">
        <ul className="space-y-1">
          {reversedHistory.map((command, index) => (
            <li
              key={index}
              onClick={() => onHistorySelect(command)}
              className="flex items-center cursor-pointer rounded break-words p-2 font-mono text-sm text-gray-400 hover:bg-zinc-700"
            >
              <FontAwesomeIcon
                icon={getCommandIcon(command)}
                className="mr-3 text-gray-500"
              />
              <span className="flex-grow">{command}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
