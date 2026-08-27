export type DecisionType = 'review' | 'read' | 'close';
export type SavedOutcome = 'kept' | 'bookmarked';

export interface TrackedTab {
  id: string;
  tabId?: number;
  windowId?: number;
  url: string;
  title: string;
  favicon?: string;
  reason: string;
  decision: DecisionType;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedItem {
  id: string;
  url: string;
  title: string;
  reason: string;
  outcome: SavedOutcome;
  savedAt: string;
}

export interface UndoClose {
  item: TrackedTab;
  closedAt: string;
  restoreTracking: boolean;
}

export interface StoreState {
  tracked: TrackedTab[];
  saved: SavedItem[];
  undo: UndoClose | null;
  dailyLimit: number;
}

export const DEFAULT_STATE: StoreState = {
  tracked: [],
  saved: [],
  undo: null,
  dailyLimit: 7,
};
