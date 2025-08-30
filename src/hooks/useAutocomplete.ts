import { useState, useCallback } from 'react';

const KEYWORDS = [
 'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
 'CREATE', 'TABLE', 'DROP', 'ALTER', 'ADD', 'CONSTRAINT', 'PRIMARY', 'KEY', 'FOREIGN',
 'REFERENCES', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON', 'GROUP', 'BY', 'ORDER',
 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'AS', 'DISTINCT', 'EXISTS', 'HAVING', 'OUTER', 'NULL'
];
const OPERATORS = [
 '=', '<>', '!=', '>', '<', '>=', '<=', 'AND', 'OR', 'IN', 'NOT', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL'
];
const FUNCTIONS = [
 'AVG()', 'COUNT()', 'SUM()', 'MIN()', 'MAX()', 'ROUND()', 'LENGTH()', 'UPPER()', 'LOWER()'
];
const FUNCTION_NAMES = FUNCTIONS.map(f => f.slice(0, -2));

const DATA_TYPES = ['VARCHAR(255)', 'INTEGER', 'TEXT', 'NUM', 'REAL', 'BLOB', 'BOOLEAN', 'DATE'];
const CONSTRAINTS = ['PRIMARY KEY', 'NOT NULL', 'UNIQUE', 'DEFAULT'];


const matchCase = (input: string, suggestion: string): string => {
 if (!input) return suggestion.toLowerCase();
 if (input.toUpperCase() === input) return suggestion.toUpperCase();
 if (input.toLowerCase() === input) return suggestion.toLowerCase();
 if (input[0] === input[0].toUpperCase() && input.substring(1).toLowerCase() === input.substring(1)) {
   return suggestion.charAt(0).toUpperCase() + suggestion.slice(1).toLowerCase();
 }
 return suggestion.toLowerCase();
};

export type ColumnSchema = {
   name: string;
   type: 'string' | 'number' | 'date' | 'boolean';
};
export type TableSchema = Record<string, ColumnSchema[]>;


export const useAutocomplete = (schema: TableSchema) => {
 const [suggestion, setSuggestion] = useState<string>('');

 const findColumnType = useCallback((columnName: string): ColumnSchema['type'] | undefined => {
   for (const tableName in schema) {
       const column = schema[tableName]?.find(col => col?.name.toLowerCase() === columnName.toLowerCase());
       if (column) {
           return column.type;
       }
   }
   return undefined;
 }, [schema]);

 const getSuggestion = useCallback((query: string) => {
   if (!query) {
     setSuggestion('');
     return;
   }

   const upperQuery = query.toUpperCase();
   const lastChar = query.slice(-1);

   const createTableIndex = upperQuery.lastIndexOf('CREATE TABLE');
   const lastOpenParenIndex = query.lastIndexOf('(');
   const lastCloseParenIndex = query.lastIndexOf(')');

   if (createTableIndex > -1 && lastOpenParenIndex > createTableIndex && lastOpenParenIndex > lastCloseParenIndex) {
       const content = query.substring(lastOpenParenIndex + 1);

       if (content.trim().endsWith(',')) {
           setSuggestion('');
           return;
       }

       const columnDefs = content.split(',');
       const currentDef = columnDefs[columnDefs.length - 1].trimStart();
       const defParts = currentDef.split(/\s+/).filter(Boolean);

       const lastPart = (query.endsWith(' ') ? defParts[defParts.length - 1] : defParts[defParts.length - 2]) || '';
       const lastPartUpper = lastPart.toUpperCase();

       const isLastPartDataType = DATA_TYPES.some(dt => {
           const baseDataType = dt.includes('(') ? dt.substring(0, dt.indexOf('(')) : dt;
           return lastPartUpper.startsWith(baseDataType);
       });

       let potentialSuggestions: string[] = [];
       if (isLastPartDataType) {
           potentialSuggestions = CONSTRAINTS;
       } else if (defParts.length > 0) {
           potentialSuggestions = DATA_TYPES;
       }

       if (query.endsWith(' ')) {
           setSuggestion(matchCase('', potentialSuggestions[0] || ''));
           return;
       }

       const wordInProgress = defParts[defParts.length - 1];
       const foundSuggestion = potentialSuggestions.find(s =>
         s.toLowerCase().startsWith(wordInProgress.toLowerCase()) && s.toLowerCase() !== wordInProgress.toLowerCase()
       );

       if (foundSuggestion) {
           const cleanSugg = foundSuggestion.includes('(') ? foundSuggestion.substring(0, foundSuggestion.indexOf('(')) : foundSuggestion;
           setSuggestion(matchCase(wordInProgress, cleanSugg));
       } else {
           setSuggestion('');
       }
       return; 
   }
   
   if (lastChar === ' ') {
       setSuggestion('');
       return;
   }
   
   const words = query.trim().split(/\s+/);
   const lastWord = words[words.length - 1] || '';
   const lastWordUpper = lastWord.toUpperCase();
   const secondLastWord = (words[words.length - 2] || '');
   const secondLastWordUpper = secondLastWord.toUpperCase();
   const thirdLastWordUpper = (words[words.length - 3] || '').toUpperCase();

   if (FUNCTION_NAMES.includes(lastWordUpper)) {
       setSuggestion('(');
       return;
   }

   let potentialSuggestions: string[] = [];
   const tableNames = Object.keys(schema);
   const allColumnNames = Object.values(schema)
     .flat()
     .filter(Boolean)
     .map(col => col.name)
     .filter(Boolean);

   if (lastWord.includes('.')) {
     const [alias] = lastWord.split('.');
     const tableForAlias = tableNames.find(t => t.toLowerCase().startsWith(alias.toLowerCase()));
     if (tableForAlias && schema[tableForAlias]) {
       potentialSuggestions = schema[tableForAlias].map(col => col.name);
     }
   } else if (['FROM', 'JOIN', 'UPDATE'].includes(secondLastWordUpper)) {
     potentialSuggestions = tableNames;
   } else if (secondLastWordUpper === 'INTO' && thirdLastWordUpper === 'INSERT') {
     potentialSuggestions = tableNames;
   } else if (secondLastWordUpper === 'BY' && ['GROUP', 'ORDER'].includes(thirdLastWordUpper)) {
       potentialSuggestions = allColumnNames;
   } else if (OPERATORS.includes(secondLastWordUpper)) {
       const columnType = findColumnType(thirdLastWordUpper);
       if (columnType === 'number') {
           potentialSuggestions = ['1'];
       } else if (columnType === 'string' || columnType === 'date') {
           potentialSuggestions = ["'value'"];
       } else {
           potentialSuggestions = ['NULL'];
       }
   } else if (allColumnNames.some(col => col.toUpperCase() === secondLastWordUpper)) {
       potentialSuggestions = OPERATORS;
   } else if (secondLastWordUpper === 'SELECT') {
       potentialSuggestions = ['*', ...allColumnNames, ...FUNCTIONS, 'DISTINCT'];
   } else {
     potentialSuggestions = [...KEYWORDS, ...FUNCTIONS, ...tableNames, ...allColumnNames];
   }

   const foundSuggestion = potentialSuggestions.find(s =>
     s.toLowerCase().startsWith(lastWord.toLowerCase()) && s.toLowerCase() !== lastWord.toLowerCase()
   );

   if (foundSuggestion) {
     if (foundSuggestion.includes('()')) {
         setSuggestion(matchCase(lastWord, foundSuggestion.slice(0, -2)));
     } else if (foundSuggestion === "'value'") {
         setSuggestion(lastWord === "'" ? "value'" : "'value'");
     } else {
         setSuggestion(matchCase(lastWord, foundSuggestion));
     }
   } else {
     setSuggestion('');
   }
 }, [schema, findColumnType]);

 return { suggestion, getSuggestion, setSuggestion };
};