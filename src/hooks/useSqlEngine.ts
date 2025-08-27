import { useState, useEffect, useRef, useCallback } from 'react'; 
import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';

interface ExecuteResult {
  message?: string;
  error?: string;
}

interface ExecutionSettings {
  linesize: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
}

export const useSqlEngine = () => {
  const [db, setDb] = useState<Database | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const SQLJs = useRef<SqlJsStatic | null>(null);

  useEffect(() => {
    const initializeDb = async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: file => `/${file}`
        });
        SQLJs.current = SQL;
        setDb(new SQLJs.current.Database());
        setIsReady(true);
      } catch (err) {
        console.error("Failed to initialize SQL.js:", err);
        setError(err as Error);
      }
    };
    initializeDb();
  }, []);

  const loadDb = useCallback((data: Uint8Array) => {
    if (!SQLJs.current || !data) return;
    try {
      setDb(new SQLJs.current.Database(data));
    } catch (err) {
      console.error("Failed to load database from data:", err);
      setError(err as Error);
    }
  }, []); 

  const executeSql = useCallback((statement: string, settings: ExecutionSettings): ExecuteResult => {
    if (!db) return { error: "Database not initialized." };
    try {
      const results = db.exec(statement);
      const changes = db.getRowsModified();
      const commandType = statement.trim().split(/\s+/)[0].toLowerCase();

      let message = '';
      if (results.length > 0) {
        const { columns, values } = results[0];
        const colWidths = columns.map((col, i) => Math.max(col.length, ...values.map(row => String(row[i] ?? 'NULL').length)));
        const header = columns.map((col, i) => col.toUpperCase().padEnd(colWidths[i])).join('  ');
        const separator = colWidths.map((_w, i) => '-'.repeat(colWidths[i])).join('  ');
        let outputLines = [header, separator];
        values.forEach(row => {
            const rowStr = row.map((val, i) => String(val ?? 'NULL').padEnd(colWidths[i])).join('  ');
            if (rowStr.length > settings.linesize) {
                outputLines.push(rowStr.substring(0, settings.linesize));
                outputLines.push(rowStr.substring(settings.linesize));
            } else {
                outputLines.push(rowStr);
            }
        });
        message = `${outputLines.join('\n')}\n\n${values.length} row(s) selected.`;
      } else {
        switch(commandType) {
            case 'insert': message = `${changes} row(s) inserted.`; break;
            case 'update': message = `${changes} row(s) updated.`; break;
            case 'delete': message = `${changes} row(s) deleted.`; break;
            case 'create': message = 'Table created.'; break;
            case 'drop': message = 'Table dropped.'; break;
            default: message = 'Statement executed.';
        }
      }
      return { message };
    } catch (err) {
      return { error: `ERROR: ${(err as Error).message}` };
    }
  }, [db]); 

  const exportDb = useCallback((): Uint8Array | null => {
    return db ? db.export() : null;
  }, [db]); 

  const getTables = useCallback((): string[] => {
  if (!db) return [];
  try {
    const results = db.exec("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    if (results.length === 0 || !results[0].values) {
      return [];
    }
    return results[0].values.flat() as string[];
  } catch (err) {
    console.error("Failed to get tables:", err);
    return [];
  }
}, [db]);

const getTableInfo = useCallback((tableName: string): ColumnInfo[] => {
  if (!db) return [];
  try {
    const stmt = db.prepare(`SELECT name, type, "notnull" FROM pragma_table_info(?)`);
    stmt.bind([tableName]);
    const columns: ColumnInfo[] = [];
    while (stmt.step()) {
      columns.push(stmt.getAsObject() as unknown as ColumnInfo);
    }
    stmt.free();
    return columns;
  } catch (err) {
    console.error(`Failed to get info for table ${tableName}:`, err);
    return [];
  }
}, [db]);

  return { db, error, isReady, loadDb, executeSql, exportDb, getTables, getTableInfo };
};