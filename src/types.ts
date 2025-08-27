export type HistoryItemType = 'welcome' | 'command' | 'output' | 'error';

export interface HistoryItem {
  type: HistoryItemType;
  text: string;
  prompt?: string;
}