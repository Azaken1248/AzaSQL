import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTable,
  faChevronRight,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { type ColumnInfo } from "../hooks/useSqlEngine";

interface SchemaViewerProps {
  tables: string[];
  onTableSelect: (tableName: string) => void;
  getTableInfo: (tableName: string) => ColumnInfo[];
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({
  tables,
  onTableSelect,
  getTableInfo,
}) => {
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>(
    {}
  );
  const [tableColumns, setTableColumns] = useState<
    Record<string, ColumnInfo[]>
  >({});

  const handleToggle = (tableName: string) => {
    const isExpanded = !!expandedTables[tableName];

    if (!isExpanded && !tableColumns[tableName]) {
      const columns = getTableInfo(tableName);
      setTableColumns((prev) => ({ ...prev, [tableName]: columns }));
    }

    setExpandedTables((prev) => ({ ...prev, [tableName]: !isExpanded }));
  };

  return (
    <aside className="w-full max-h-[97.3%] rounded-lg border border-gray-700 bg-zinc-800 p-4 flex flex-col">
      <h2 className="mb-2 font-bold text-gray-400 flex-shrink-0">Tables</h2>
      <hr className="border-gray-500" />
      <div className="overflow-y-auto">
        <ul>
          {tables.map((table) => {
            const isExpanded = !!expandedTables[table];
            return (
              <li key={table} className="text-gray-300">
                <div className="flex items-center justify-between rounded hover:bg-zinc-700">
                  <div
                    onClick={() => onTableSelect(table)}
                    className="flex items-center cursor-pointer flex-grow p-1"
                  >
                    <FontAwesomeIcon
                      icon={faTable}
                      className="mr-2 text-gray-500"
                    />
                    <span className="truncate">{table}</span>
                  </div>
                  <FontAwesomeIcon
                    icon={isExpanded ? faChevronDown : faChevronRight}
                    className="cursor-pointer p-2 text-gray-500"
                    onClick={() => handleToggle(table)}
                  />
                </div>
                {isExpanded && tableColumns[table] && (
                  <ul className="ml-4 mt-1 border-l border-gray-600 pl-2">
                    {tableColumns[table].map((col) => (
                      <li
                        key={col.name}
                        className="flex items-center text-xs text-gray-400 py-0.5"
                      >
                        <span className="truncate">{col.name}</span>
                        <span className="ml-auto text-gray-500">
                          {col.type}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};
